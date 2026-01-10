export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-void text-white flex items-center justify-center px-6">
      <div className="glass rounded-2xl p-6 max-w-lg text-center">
        <div className="text-xl font-semibold mb-2">Payment complete.</div>
        <div className="text-white/70 text-sm">
          If you’re not redirected, open your reveal link again.
        </div>
        <a className="inline-block mt-4 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15" href="/">
          Return home
        </a>
      </div>
    </main>
  );
}
