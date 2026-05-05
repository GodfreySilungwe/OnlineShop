// API utility functions for handling different environments
const API_BASE_URL = 'https://8nhfw2nleg.execute-api.us-east-1.amazonaws.com'
const S3_BUCKET_URL = 'http://goshretrauntfrontendbucket.s3-website-us-east-1.amazonaws.com/'

export const getApiUrl = (path) => {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}/${cleanPath}`
}

export const getImageSources = (filename) => {
  if (!filename) return { primary: null, fallback: null }
  const cleanName = filename.startsWith('/') ? filename.slice(1) : filename
  const primary = S3_BUCKET_URL ? `${S3_BUCKET_URL}/${cleanName}` : getApiUrl(`images/${cleanName}`)
  const fallback = getApiUrl(`images/${cleanName}`)
  return { primary, fallback }
}

export const getImageUrl = (filename) => {
  return getImageSources(filename).primary
}

export const apiFetch = async (path, options = {}) => {
  const url = getApiUrl(path)
  return fetch(url, options)
}