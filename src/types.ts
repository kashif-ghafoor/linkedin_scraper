export type Output = {
  profileName?: string;
  profileUrl?: string;
  jobTitle: string;
  companyName: string;
  companyLink: string;
};
export interface IArguments {
  session_id: string;
  search_keyword: string;
  input?: string;
  output?: string;
  saved_search?: string;
}