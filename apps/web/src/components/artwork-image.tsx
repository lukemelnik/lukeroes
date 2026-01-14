import { Disc3 } from "lucide-react";
import { useEffect, useState } from "react";

type ArtworkImageProps = {
	src?: string;
	alt?: string;
	className?: string;
};

export function ArtworkImage({ src, alt, className }: ArtworkImageProps) {
	const [hasError, setHasError] = useState(!src);

	useEffect(() => {
		setHasError(!src);
	}, [src]);

	if (hasError) {
		return (
			<div
				className={`flex items-center justify-center rounded bg-muted/20 ${className}`}
			>
				<Disc3 className="h-1/3 w-1/3 text-muted-foreground/50" />
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			className={className}
			onError={() => setHasError(true)}
		/>
	);
}
