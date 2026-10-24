export type AddressSuggestion = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

type GeoapifyResult = {
  place_id?: string;
  formatted?: string;
  address_line1?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
};

export function mapGeoapifyResults(payload: { results?: GeoapifyResult[] }): AddressSuggestion[] {
  return (payload.results ?? []).flatMap((result, index) => {
    if (!result.formatted) return [];
    const street = result.address_line1
      ?? [result.housenumber, result.street].filter(Boolean).join(" ");

    return [{
      id: result.place_id ?? `${result.formatted}-${index}`,
      label: result.formatted,
      street,
      city: result.city ?? result.county ?? "",
      state: result.state_code ?? result.state ?? "",
      zip: result.postcode ?? "",
    }];
  });
}
