'use client';

interface SearchFormProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

export default function SearchForm({
  onSearch,
  isLoading,
}: SearchFormProps) {
  return (
    <div>
      SearchForm
    </div>
  );
}