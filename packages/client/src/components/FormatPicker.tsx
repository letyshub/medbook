interface FormatPickerProps {
  value: 'pdf' | 'epub';
  onChange: (value: 'pdf' | 'epub') => void;
  disabled?: boolean;
}

export function FormatPicker({ value, onChange, disabled = false }: FormatPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-gray-100 font-medium">Output Format</label>
      <div className="flex space-x-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="format"
            value="pdf"
            checked={value === 'pdf'}
            onChange={() => onChange('pdf')}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-gray-100">PDF</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="format"
            value="epub"
            checked={value === 'epub'}
            onChange={() => onChange('epub')}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-gray-100">ePub</span>
        </label>
      </div>
    </div>
  );
}
