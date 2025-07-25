// normalize the social account names
// Socail Acct Names are:
// - facebook
// - fb_instagram_account
// - google_my_business
// - linkedin_company
// - linkedin

export const normalizeNames= (name: string) => {
  // if the name is facebook, return "Facebook"
  if (name === 'facebook') {
    return 'Facebook';
  }
  // if the name is fb_instagram_account, return "Facebook"
  if (name === 'fb_instagram_account') {
    return 'Instagram';
  }
  // if the name is google_my_business, return "Google My Business"
  if (name === 'google_my_business') {
    return 'Google My Business';
  }
  // if the name is linkedin_company, return "LinkedIn"
  if (name === 'linkedin_company') {
    return 'LinkedIn';
  }
  // if the name is linkedin, return "LinkedIn"
  if (name === 'linkedin') {
    return 'LinkedIn';
  }
  // if the name is twitter, return "Twitter"
  if (name === 'twitter') {
    return 'Twitter';
  }
  // if the name is yelp, return "Yelp"
  if (name === 'yelp') {
    return 'Yelp';
  }
  // if the name is youtube, return "YouTube"
  if (name === 'youtube') {
    return 'YouTube';
  }
  // if the name is tiktok, return "TikTok"
  if (name === 'tiktok') {
    return 'TikTok';
  }
  // if the name is pinterest, return "Pinterest"
};