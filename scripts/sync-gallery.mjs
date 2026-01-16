// scripts/sync-gallery.mjs
// SharePoint(Teams) 폴더 이미지 → repo assets/gallery 동기화 + index.json 생성
//
// 필요한 GitHub Actions env/secrets:
// - TENANT_ID (예: xh0y4.onmicrosoft.com 또는 Tenant GUID)
// - CLIENT_ID
// - CLIENT_SECRET
// - SP_FOLDER_SHARE_URL (SharePoint 폴더 "공유 링크")
//
// 선택 옵션(환경변수):
// - DELETE_MISSING=true  -> SharePoint 폴더에 없는 파일을 repo에서도 삭제(미러링)
// - MAX_IMAGES=15        -> 최대 몇 장만 유지할지 (기본 200)
// - INCLUDE_EXTS="jpg,jpeg,png,webp" -> 허용 확장자 제한(기본 jpg,jpeg,png,webp)
// - INDEX_FILE="assets/gallery/index.json" -> 인덱스 파일 경로(기본값)

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const {
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET,
  SP_FOLDER_SHARE_URL,
  DELETE_MISSING,
  MAX_IMAGES,
  INCLUDE_EXTS,
  INDEX_FILE,
} = process.env;

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !SP_FOLDER_SHARE_URL) {
  throw new Error(
    "Missing required env vars: TENANT_ID, CLIENT_ID, CLIENT_SECRET, SP_FOLDER_SHARE_URL"
  );
}

const GALLERY_DIR = "assets/gallery";
const INDEX_PATH = INDEX_FILE || "assets/gallery/index.json";
const MAX = Number.isFinite(Number(MAX_IMAGES)) ? Number(MAX_IMAGES) : 200;
const deleteMissing = String(DELETE_MISSING || "").toLowerCase() === "true";
const allowedExts = new Set(
  (INCLUDE_EXTS || "jpg,jpeg,png,webp")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);

fs.mkdirSync(GALLERY_DIR, { recursive: true });

function toShareId(url) {
  // base64url + prefix u!
  const b64 = Buffer.from(url, "utf8").toString("base64");
  return (
    "u!" + b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  );
}

function extFromName(name, mimeType) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  const ext = m ? m[1].toLowerCase() : "";
  if (ext && allowedExts.has(ext)) return ext;

  // fallback from mime
  const mt = (mimeType || "").toLowerCase();
  if (mt.includes("jpeg")) return "jpeg";
  if (mt.includes("jpg")) return "jpg";
  if (mt.includes("png")) return "png";
  if (mt.includes("webp")) return "webp";
  return "";
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
  if (!res.ok || !json.access_token) {
    throw new Error(`Token error: ${JSON.stringify(json, null, 2)}`);
  }
  return json.access_token;
}

async function graphJson(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Graph error ${res.status}: ${JSON.stringify(json, null, 2)}`);
  return json;
}

async function downloadToFile(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${outPath}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

function listLocalImages() {
  if (!fs.existsSync(GALLERY_DIR)) return [];
  return fs
    .readdirSync(GALLERY_DIR)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .map((name) => path.join(GALLERY_DIR, name));
}

function writeIndexJson(fileNamesInOrder) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(fileNamesInOrder, null, 2), "utf8");
}

(async () => {
  console.log("🔐 Getting token...");
  const token = await getToken();
  console.log("✅ Token acquired");

  console.log("📁 Resolving SharePoint folder from share link...");
  const shareId = toShareId(SP_FOLDER_SHARE_URL);
  const folder = await graphJson(
    `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem`,
    token
  );

  const driveId = folder?.parentReference?.driveId;
  const folderId = folder?.id;
  if (!driveId || !folderId) {
    throw new Error(`Folder resolve failed: ${JSON.stringify(folder, null, 2)}`);
  }

  console.log("📄 Listing folder children...");
  const children = await graphJson(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}/children?$top=200`,
    token
  );

  // 이미지 항목만 필터링
  let items = (children.value || [])
    .filter((x) => x.file?.mimeType?.startsWith("image/"))
    .map((x) => ({
      id: x.id,
      name: x.name,
      mimeType: x.file?.mimeType || "",
      downloadUrl: x["@microsoft.graph.downloadUrl"],
      created: x.createdDateTime || "",
      lastModified: x.lastModifiedDateTime || "",
    }))
    .filter((x) => !!x.id && !!x.downloadUrl);

  // 정렬: 파일명 기준(숫자 포함 정렬)
  items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  // 최대 개수 제한
  items = items.slice(0, MAX);

  console.log(`🖼️ Found ${items.length} image(s) (max ${MAX})`);

  // 안정적인 파일명: item.id + 확장자
  // (SharePoint에서 파일명 변경/공백/한글 있어도 안정적으로 추적 가능)
  const desired = new Map(); // filename -> item
  const orderedFileNames = [];

  for (const it of items) {
    const ext = extFromName(it.name, it.mimeType);
    if (!ext) continue;
    const fileName = `${it.id}.${ext}`;
    desired.set(fileName, it);
    orderedFileNames.push(fileName);
  }

  // 1) 다운로드 (없는 것만)
  for (const [fileName, it] of desired.entries()) {
    const outPath = path.join(GALLERY_DIR, fileName);
    if (fs.existsSync(outPath)) {
      // 이미 있으면 스킵
      continue;
    }
    console.log(`⬇️ Download ${it.name} -> ${fileName}`);
    await downloadToFile(it.downloadUrl, outPath);
  }

  // 2) 삭제 동기화(옵션): SharePoint에 없는 로컬 파일 삭제
  if (deleteMissing) {
    console.log("🧹 DELETE_MISSING=true → local cleanup enabled");
    const localFiles = listLocalImages().map((p) => path.basename(p));
    for (const lf of localFiles) {
      if (!desired.has(lf)) {
        console.log(`🗑️ Remove local file not in SharePoint: ${lf}`);
        fs.unlinkSync(path.join(GALLERY_DIR, lf));
      }
    }
  } else {
    console.log("ℹ️ DELETE_MISSING is false → local cleanup skipped");
  }

  // 3) index.json 생성 (프론트에서 자동 로딩용)
  // index.json은 "파일명 배열"만 담음 (순서 = SharePoint 정렬 순서)
  console.log(`🧾 Writing ${INDEX_PATH}`);
  writeIndexJson(orderedFileNames);

  console.log("✅ Sync complete");
})();
