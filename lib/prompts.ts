/**
 * Prompts for URL summarization
 */

// Prompt for generating a summary of a URL
export const summaryPrompt = `
Please visit this URL and provide a concise summary of the content: {url}
The summary should be 2-3 paragraphs that capture the main points of the content.
`;

// Prompt for extracting key points from a URL
export const keytakeawaysPrompt = `
Please visit this URL and extract 3-5 key takeaways or important points: {url}
List each key point on a new line. Do not include bullet points or numbering.
`;

// Prompt for generating tags for a URL
export const tagsPrompt = `
Please visit this URL and generate 3-5 relevant tags for the content: {url}
Provide the tags as a comma-separated list, with no additional text.
`; 