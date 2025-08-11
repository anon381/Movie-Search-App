// Generic provider contract documentation.
// search({ query, page, year, type, signal }) -> { list: MovieSummary[], total }
// details(id) -> MovieDetail
// MovieSummary: { id, imdbID?, Title, Year, Poster, Type }
export function mapToCard(model) { return model }
