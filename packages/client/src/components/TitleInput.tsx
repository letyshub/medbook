interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TitleInput({ value, onChange, disabled = false }: TitleInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="title" className="block text-gray-100 font-medium">
        eBook Title
      </label>
      <input
        type="text"
        id="title"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Enter a title for your eBook"
      />
    </div>
  );
}
