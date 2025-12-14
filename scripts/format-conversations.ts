/**
 * Convierte el JSON exportado de Bird a un TXT legible con solo interacciones.
 *
 * Uso:
 *   pnpm dlx tsx scripts/format-conversations.ts convers/whatsapp-conversations-YYYY-MM-DD.json [salida.txt]
 *
 * Si no se pasa salida, genera <input>-pretty.txt en la misma carpeta.
 */
import fs from 'node:fs';
import path from 'node:path';

type TextMessage = {
  id: string;
  at: string;
  role: string;
  sender?: string | null;
  text: string;
};

type ExportedConversation = {
  conversationId: string;
  channelId?: string | null;
  contactPhone?: string | null;
  lastMessageAt?: string | null;
  messages: TextMessage[];
};

function formatTimestamp(iso?: string | null) {
  if (!iso) return 'n/a';
  return iso.replace('T', ' ').replace('Z', '');
}

function buildOutput(conversations: ExportedConversation[]) {
  const lines: string[] = [];
  const total = conversations.length;

  conversations.forEach((conv, index) => {
    lines.push(
      `Conversation ${index + 1}/${total} | id=${conv.conversationId} | phone=${
        conv.contactPhone ?? 'unknown'
      } | last=${formatTimestamp(conv.lastMessageAt ?? null)}`
    );

    const sorted = [...conv.messages].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
    );

    for (const msg of sorted) {
      const ts = formatTimestamp(msg.at);
      const role = msg.role ?? 'unknown';
      const sender = msg.sender ?? 'unknown';
      lines.push(`${ts} | ${role} | ${sender}: ${msg.text}`);
    }

    lines.push(''); // blank line between conversations
  });

  return lines.join('\n');
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Uso: pnpm dlx tsx scripts/format-conversations.ts <input.json> [salida.txt]');
    process.exit(1);
  }

  const resolvedInput = path.resolve(process.cwd(), input);
  const output =
    process.argv[3] ??
    resolvedInput.replace(/\.json$/i, '-pretty.txt').replace(/\.JSON$/i, '-pretty.txt');

  if (!fs.existsSync(resolvedInput)) {
    console.error(`No se encontró el archivo de entrada: ${resolvedInput}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedInput, 'utf8');
  const data = JSON.parse(raw) as ExportedConversation[];

  if (!Array.isArray(data)) {
    console.error('El archivo de entrada no contiene un arreglo de conversaciones');
    process.exit(1);
  }

  const text = buildOutput(data);
  fs.writeFileSync(output, text, 'utf8');

  console.log(`Generado archivo legible con ${data.length} conversaciones -> ${output}`);
}

main();
