interface PostDateProps {
  date: string;
}

export function PostDate({ date }: PostDateProps) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let display: string;
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      display = "Just now";
    } else {
      display = `${diffHours}h ago`;
    }
  } else if (diffDays === 1) {
    display = "Yesterday";
  } else if (diffDays < 7) {
    display = `${diffDays}d ago`;
  } else {
    display = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <time
      dateTime={date}
      title={d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}
    >
      {display}
    </time>
  );
}
