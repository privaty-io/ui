interface FieldRegistration {
  name: string;
  initialValue: unknown;
  required: boolean;
  getValue: () => unknown;
  setValue: (value: unknown) => void;
}

export type { FieldRegistration };
