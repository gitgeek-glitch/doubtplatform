export default function NotFound() {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center">
        <h1 className="text-9xl font-bold text-purple-600">404</h1>
        <h2 className="text-3xl font-bold mt-4">Page Not Found</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white"
        >
          Back to Home
        </a>
      </div>
    )
  }  