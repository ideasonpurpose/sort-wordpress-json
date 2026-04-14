/**
 * https://github.com/sindresorhus/detect-indent/blob/25d3cf12f54807147e56ac3d4f557c9cc7904c96/index.d.ts#L1-L18
 */
export type Indent = {
  /**
	The type of indentation.

	It is `undefined` if no indentation is detected.
	*/
  type: "tab" | "space" | undefined;

  /**
	The amount of indentation. For example, `2`.
	*/
  amount: number;

  /**
	The actual indentation.
	*/
  indent: string;
};

export type CliArgs = {
  file?: string;
  schema?: string;
  indent?: Indent | false;
  noDefaultOverrides?: boolean;
  overrides?: string[];
  expansions?: string[];
  version?: boolean;
  dryRun?: boolean;
};
