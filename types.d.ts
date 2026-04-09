export type IndentOption = {
  amount: number;
  indent: string;
  type: string;
};

export type CliArgs = {
  file?: string;
  schema?: string;
  indent?: IndentOption | false;
  noDefaultOverrides?: boolean;
  overrides?: string[];
  version?: boolean;
  dryRun?: boolean;
};