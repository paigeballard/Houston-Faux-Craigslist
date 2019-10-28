const getAllListingsQuery = `
  SELECT * 
  FROM sales
  ORDER BY created_at ASC
`

module.exports = {
  getAllListingsQuery: getAllListingsQuery
}