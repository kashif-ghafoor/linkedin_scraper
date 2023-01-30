import mariadb from "mariadb";

/**
 *
 * @param links - array of links to save to database
 * @returns void
 * throws error if cannot connect to database
 * throws error if there is an error while closing connection.
 */

export async function saveToDatabase(links: string[]) {
  if (links.length === 0) {
    console.error("no links to save to database");
    return;
  }
  const connection = await mariadb.createConnection({
    host: "147.182.254.121",
    user: "remotelinkedin",
    password: "Link3d@2432",
    database: "linkedin",
    port: 3306,
    connectTimeout: 180000, // three minute timeout
  });
  try {
    // query will ignore duplicates and insert only unique values
    const query = "INSERT IGNORE INTO master_profiles (url) values (?)";

    const data = links.map((link) => {
      return [link];
    });
    const response = await connection.batch(query, data);
    console.log("response: ", response);
  } catch (err) {
    console.error("Error while saving links to database: ", err);
  } finally {
    connection.end();
  }
}
