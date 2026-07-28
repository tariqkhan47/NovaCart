type StarsProps = {
  rating: number;
  className?: string;
};

export default function Stars({ rating, className = "" }: StarsProps) {
  const rounded = Math.round(rating);

  return (
    <span
      className={`text-brand-500 tracking-wide ${className}`}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {"★".repeat(rounded)}
      <span className="text-muted-soft opacity-40">
        {"★".repeat(5 - rounded)}
      </span>
    </span>
  );
}
