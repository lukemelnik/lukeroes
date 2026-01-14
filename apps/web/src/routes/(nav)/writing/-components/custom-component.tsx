import { useState } from "react";
import { Button } from "@/components/ui/button";

export const CustomComponent = () => {
	const [count, setCount] = useState(0);
	return (
		<div>
			<div>{count}</div>
			<Button onClick={() => setCount(count + 1)}>ADD NUM</Button>
		</div>
	);
};
