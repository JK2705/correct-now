interface WordCounterProps {
  count: number;
  limit: number;
}

const WordCounter = ({ count, limit }: WordCounterProps) => {
  const percentage = (count / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = count > limit;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`font-medium ${
          isOverLimit
            ? "text-destructive"
            : isNearLimit
            ? "text-warning"
            : "text-muted-foreground"
        }`}
      >
        {count.toLocaleString()}
      </span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{limit.toLocaleString()} words</span>
      {isOverLimit && (
        <span className="text-destructive text-xs font-medium">
          (limit exceeded)
        </span>
      )}
    </div>
  );
};

export default WordCounter;
