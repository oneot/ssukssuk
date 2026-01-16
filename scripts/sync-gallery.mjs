import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const {
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET,
  SP_FOLDER_SHARE_URL,
} = process.env;

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !SP_FOLDER_SHARE_URL) {
  throw new Error("❌ Missing environment variables");
}

const GALLERY_DIR = "assets/gallery";
fs.mkdirSync(GALLERY_DIR, { recursive: true });

/* ---------------- helpers ---------------- */

function toShareId(url) {
  const b64 = Buffer.from(url, "utf8").toString("base64");
  return (
    "u!" +
    b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  );
}

async function getToken() {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json, null, 2));
  return json.access_token;
}

async function graph(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json, null, 2));
  return json;
}

/* ---------------- main ---------------- */

(async () => {
  console.log("🔐 Getting token...");
  const token = await getToken();

  console.log("📁 Resolving SharePoint folder...");
  const shareId = toShareId(SP_FOLDER_SHARE_URL);
  const folder = await graph(
    `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem`,
    token
  );

  const driveId = folder.parentReference?.driveId;
  const folderId = folder.id;
  if (!driveId || !folderId) throw new Error("Folder resolve failed");

  console.log("📸 Fetching images...");
  const children = await graph(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}/children?$top=200`,
    token
  );

  const images = (children.value || [])
    .filter((x) => x.file?.mimeType?.startsWith("image/"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  console.log(`➡️ ${images.length} images found`);

  for (const item of images) {
    const outPath = path.join(GALLERY_DIR, item.name);

    if (fs.existsSync(outPath)) {
      console.log(`✔ Skip ${item.name}`);
      continue;
    }

    console.log(`⬇ Download ${item.name}`);
    const res = await fetch(item["@microsoft.graph.downloadUrl"]);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
  }

  console.log("✅ Gallery sync complete");
})();
