import * as zlib from "zlib";

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

export function extractDocxText(buffer: Buffer): string {
  const documentXml = readZipEntry(buffer, "word/document.xml");
  if (!documentXml) {
    throw new Error("DOCX file does not contain word/document.xml.");
  }

  return extractTextFromDocumentXml(documentXml.toString("utf-8"));
}

function readZipEntry(zip: Buffer, entryName: string): Buffer | null {
  const entries = readCentralDirectory(zip);
  const entry = entries.find((item) => item.name === entryName);
  if (!entry) return null;

  const localOffset = entry.localHeaderOffset;
  if (zip.readUInt32LE(localOffset) !== 0x04034b50) {
    throw new Error(`Invalid local ZIP header for ${entryName}.`);
  }

  const fileNameLength = zip.readUInt16LE(localOffset + 26);
  const extraLength = zip.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + fileNameLength + extraLength;
  const compressedData = zip.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.method === 0) return compressedData;
  if (entry.method === 8) return zlib.inflateRawSync(compressedData);

  throw new Error(`Unsupported ZIP compression method: ${entry.method}.`);
}

function readCentralDirectory(zip: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset < zip.length - 46) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) {
      offset += 1;
      continue;
    }

    const method = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const fileNameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localHeaderOffset = zip.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = zip.subarray(nameStart, nameStart + fileNameLength).toString("utf-8");

    entries.push({
      name,
      method,
      compressedSize,
      localHeaderOffset,
    });

    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function extractTextFromDocumentXml(xml: string): string {
  const parts: string[] = [];
  const tokenPattern = /<w:t[^>]*>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>|<\/w:p>/g;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(xml)) !== null) {
    const [token, text] = match;

    if (text !== undefined) {
      parts.push(decodeXmlEntities(text));
    } else if (token.startsWith("<w:tab")) {
      parts.push("\t");
    } else {
      parts.push("\n");
    }
  }

  return parts
    .join("")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
