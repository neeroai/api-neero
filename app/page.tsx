export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI WhatsApp Bot Template</h1>
        <p className="text-lg text-gray-600 mb-8">
          Template successfully initialized. Start building your bot!
        </p>
        <div className="space-y-2 text-left">
          <p className="text-sm">Next steps:</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            <li>Configure .env.local with your credentials</li>
            <li>Implement WhatsApp webhook in app/api/whatsapp/route.ts</li>
            <li>Implement AI chat endpoint in app/api/chat/route.ts</li>
            <li>Update CLAUDE.md with your project context</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
