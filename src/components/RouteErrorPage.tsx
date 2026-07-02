import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "页面渲染时出现异常。";
}

export default function RouteErrorPage() {
  const error = useRouteError();
  const message = getErrorMessage(error);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl border border-border bg-paper px-6 py-8 shadow-[0_24px_80px_rgba(120,113,108,0.09)]">
        <p className="text-xs font-sans uppercase tracking-widest text-subtle mb-4">
          Application Error
        </p>
        <h1 className="text-2xl md:text-3xl font-serif font-medium leading-tight mb-4">
          页面暂时无法渲染
        </h1>
        <p className="text-sm text-muted font-serif leading-relaxed mb-6 break-words">
          {message}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="border border-foreground px-4 py-2 text-xs font-sans uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
          <Link
            to="/"
            className="border border-border px-4 py-2 text-xs font-sans uppercase tracking-widest text-subtle hover:text-foreground hover:border-foreground transition-colors"
          >
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
