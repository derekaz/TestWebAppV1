import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CosmosClient } from "@azure/cosmos"

// const { CosmosClient } = require("@azure/cosmos");
const endpoint = "https://azmoore-westus2-cdb.documents.azure.com:443/";
const key = "dBXaz7Sws2V2ie02hAB84KBEuhEYl64ai2PD3Kat3iKdNeb2yzqxB6W60Og15z7MLljRd68mIIBQdu5vBI5oAw==";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    var testVal: String[]
    var errorText: String
    
    try {
        //const client = new CosmosClient({ endpoint, key });
        //testVal = await getData(client, context);

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: {
                input: name,
                message: responseMessage,
                testFunc: testVal,
                key: key,
                errorText: errorText
            }
        };
    } catch (error) {
        errorText = error;
        context.log(error);

        if (error.code === 409) {
          context.log("There was a conflict with an existing item");
        }
    
        context.res = {
            status: 500,
            body: error.message
        }
    }
}

async function getData(client: CosmosClient, context: Context) : Promise<String[]> {
    context.log('getData');

    const { database } = await client.databases.createIfNotExists({ id: "azmoore-westus2-db1" });
    // context.log(database.id);

    const { container } = await database.containers.createIfNotExists({ id: "azmoore-westus2-dbc1" });
    // context.log(container.id);

    const cities = [
        { id: "1", name: "Olympia", state: "WA", isCapitol: true },
        { id: "2", name: "Redmond", state: "WA", isCapitol: false },
        { id: "3", name: "Chicago", state: "IL", isCapitol: false },
        { id: "4", name: "Phoenix", state: "AZ", isCapitol: true }
    ];

    for (const city of cities) {
        try {
            // await container.items.create(city);
            await container.items.upsert(city)
        } catch(e) {
            if (e.code === 409) {
                context.log("There was a conflict with an existing item");
            } else {
                context.log(e);
            }
        }
    }

    const { resources } = await container.items
    .query("SELECT * from c WHERE c.isCapitol = true")
    .fetchAll();

    var capitols: string[] = []

    for (const city of resources) {
        const cityNote = `${city.name}, ${city.state} is a capitol `
        capitols.push(cityNote);
        context.log(cityNote);
    }

    return capitols
}

export default httpTrigger;