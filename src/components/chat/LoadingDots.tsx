export function LoadingDots() {
  return (
    <div className="flex space-x-1">
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.4s]" />
    </div>
  );
} 