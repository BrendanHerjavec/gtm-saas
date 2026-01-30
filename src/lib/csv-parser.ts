const COLUMN_MAP: Record<string, string> = {
  email: "email",
  "e-mail": "email",
  "email address": "email",
  "email_address": "email",
  "first name": "firstName",
  firstname: "firstName",
  first_name: "firstName",
  "last name": "lastName",
  lastname: "lastName",
  last_name: "lastName",
  phone: "phone",
  "phone number": "phone",
  phone_number: "phone",
  company: "company",
  "company name": "company",
  company_name: "company",
  "job title": "jobTitle",
  jobtitle: "jobTitle",
  job_title: "jobTitle",
  title: "jobTitle",
  linkedin: "linkedinUrl",
  "linkedin url": "linkedinUrl",
  linkedinurl: "linkedinUrl",
  linkedin_url: "linkedinUrl",
  address: "address",
  notes: "notes",
  tags: "tags",
};

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  error?: string;
}

export function parseCSV(text: string): ParsedCSV {
  const lines = parseCSVLines(text);
  if (lines.length < 2) {
    return { headers: [], rows: [], error: "CSV must have a header row and at least one data row" };
  }

  const rawHeaders = lines[0];
  const headers: string[] = [];
  const headerIndexMap: Map<number, string> = new Map();

  for (let i = 0; i < rawHeaders.length; i++) {
    const normalized = rawHeaders[i].trim().toLowerCase();
    const mapped = COLUMN_MAP[normalized];
    if (mapped) {
      headers.push(mapped);
      headerIndexMap.set(i, mapped);
    }
  }

  if (!headers.includes("email")) {
    return { headers, rows: [], error: "CSV must contain an 'email' column" };
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i];
    // Skip empty rows
    if (fields.length === 1 && fields[0].trim() === "") continue;

    const row: Record<string, string> = {};
    headerIndexMap.forEach((fieldName, colIndex) => {
      const value = (fields[colIndex] || "").trim();
      if (value) {
        row[fieldName] = value;
      }
    });

    // Only include rows that have at least an email
    if (row.email) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

function parseCSVLines(text: string): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\n") {
        current.push(field);
        field = "";
        lines.push(current);
        current = [];
      } else if (ch === "\r") {
        // skip, \n will follow
      } else {
        field += ch;
      }
    }
  }

  // Last field/line
  if (field || current.length > 0) {
    current.push(field);
    lines.push(current);
  }

  return lines;
}

export function generateCSVTemplate(): string {
  return "email,first name,last name,phone,company,job title,linkedin url,address,notes,tags\n";
}
