import mariadb from "mariadb";
import { Output } from "./types";
import { saveToDatabase } from "../linksScraper/database";
import fs from "fs";
//TODO - store connectionOptions in environement variables.
const connectionOptions = {
  host: "147.182.254.121",
  user: "remotelinkedin",
  password: "Link3d@2432",
  database: "linkedin",
  port: 3306,
  connectTimeout: 180000, // three minute timeout
};

export async function getUnscrapedLinksFromDatabase() {
  const connection = await mariadb.createConnection(connectionOptions);

  try {
    const query =
      "SELECT url FROM master_profiles WHERE is_scraped = 0 LIMIT 10";
    const response = await connection.query({ rowsAsArray: true, sql: query });
    const urls: string[] = response.map((item: [string]) => item[0]);
    return urls;
  } catch (err) {
    throw new Error("Error while fetching links from database: " + err);
  } finally {
    connection.end();
  }
}

// function updates master_profiles table with passed profiles;
// thne save data of scraped file to profiles table.
export async function saveScrapedDatatoDatabase(
  data: Output[],
  keyword: string,
  urls: string[]
) {
  const connection = await mariadb.createConnection(connectionOptions);
  const updateQuery = `UPDATE master_profiles SET is_scraped = 1, result = 'success', search_term = '${keyword}'  WHERE url IN ${getUrlList(
    urls
  )}`;
  const values = data.map((profile) => {
    return [
      profile.profileName,
      profile.profileUrl,
      profile.jobTitle,
      profile.companyName,
      profile.companyLink,
      keyword,
    ];
  });
  try {
    // updating master_profiles table.
    const result = await connection.execute(updateQuery).catch((err) => {
      throw new Error("Error while updating database: " + err);
    });
    console.log("Updated master_profiles table for passed profiles: ", result);

    // inserting scraped data into profiles table.
    const query = `INSERT INTO profiles (profile_name, profile_url, job_title, company_name, company_link, search_term) VALUES (?,?,?,?,?,?)`;
    const response = await connection.batch(query, values);
    console.log("Inserted into profiles table: ", response);
  } catch (err) {
    console.log(err);
    console.log("saving data to json for backup");
    const profiles = JSON.parse(
      fs.readFileSync("./backup/backup.json", "utf-8")
    );
    profiles.push(...data);
    fs.writeFileSync("./backup/backup.json", JSON.stringify(profiles));
    console.log("saved data to bakcup.json for backup");
  } finally {
    connection.end();
  }
}

// function to update master_profiles table for failed profiles
export async function updateTableForFailedProfiles(
  urls: string[],
  keyword: string
) {
  const connection = await mariadb.createConnection(connectionOptions);
  const query = `UPDATE master_profiles SET is_scraped = 1, result = 'failure', search_term = '${keyword}'  WHERE url IN ${getUrlList(
    urls
  )}`;
  try {
    const response = await connection.execute(query);
    console.log(
      "Updated master_profiles table for failed profiles: ",
      response
    );
  } catch (err) {
    console.log(err);
  } finally {
    connection.end();
  }
}

// function makes list of urls in format (url1, url2, url3)
function getUrlList(list: string[]) {
  let query = "(";
  list.forEach((item) => {
    query += `"${item}",`;
  });
  return query.slice(0, -1) + ")";
}
