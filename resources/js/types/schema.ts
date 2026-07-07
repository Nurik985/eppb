export type FieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'money'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'date'
    | 'file'
    | 'bin'
    | 'region'
    | 'computed';

export type FieldOption = {
    value: string;
    label: string;
};

export type ConditionRule = {
    field?: string;
    op?: string;
    value?: unknown;
    rules?: ConditionRule[];
};

export type SchemaField = {
    id: string;
    type: FieldType;
    label: string;
    hint?: string;
    placeholder?: string;
    required?: boolean;
    default?: unknown;
    options?: FieldOption[];
    reference?: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
    visibleWhen?: ConditionRule;
    computed?: {
        formula: string;
        decimals?: number;
    };
};

export type SchemaStep = {
    id: string;
    title: string;
    description?: string;
    fields: SchemaField[];
};

export type SchemaSettings = {
    submitLabel?: string;
    successMessage?: string;
};

export type ServiceSchema = {
    steps: SchemaStep[];
    settings?: SchemaSettings;
};

/** Значения формы: id поля → значение. */
export type FormValues = Record<string, unknown>;

/** Справочники, приходящие с сервера: type → список опций. */
export type ReferenceMap = Record<string, FieldOption[]>;
