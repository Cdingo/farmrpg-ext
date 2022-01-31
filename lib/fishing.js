import { fetchInventory } from './inventory.js'

const parseNetResults = (page, url) => {
    const results = {items: []}
    // Parse the ID out of the URL.
    const parsedUrl = new URL(url)
    results.locID = parsedUrl.searchParams.get("id")
    // Parse the images out of the HTML.
    const parser = new DOMParser()
    const dom = parser.parseFromString(page, "text/html")
    for (const image of dom.querySelectorAll("img")) {
        results.items.push({
            image: image.getAttribute("src"),
            overflow: (image.getAttribute("style") || "").includes("grayscale"),
        })
    }
    return results
}

const visitNetResults = async (state, page, url) => {
    const results = parseNetResults(page, url)
    const loc = await state.locations.getByID("fishing", results.locID)
    if (!loc) {
        throw "Unknown fishing loc for results"
    }
    const items = []
    for (const item of results.items) {
        // Try to map the image back to a specific item.
        const possibleItems = await state.items.getByImage(item.image)
        const matchedItem = loc.matchItem(possibleItems, item.image)
        if (!matchedItem) {
            continue
        }
        // Update inventory if needed.
        if (item.overflow) {
            state.player.inventory[matchedItem.name] = state.player.maxInventory
        } else {
            state.player.inventory[matchedItem.name] += item.quantity
        }
        items.push({item: matchedItem.name, overflow: item.overflow})
    }
    await state.player.save(state.db)
    await state.log.net({location: loc.name, items})
}

const parseFishing = (page, url) => {
    const loc = {items: []}
    // Parse the ID out of the URL.
    const parsedUrl = new URL(url)
    loc.id = parsedUrl.searchParams.get("id")
    // Parse the name from the HTML.
    const parser = new DOMParser()
    const dom = parser.parseFromString(page, "text/html")
    loc.name = dom.querySelector(".center.sliding").childNodes[0].nodeValue.trim()
    return loc
}

const visitFishing = async (state, page, url) => {
    const loc = parseFishing(page, url)
    state.lastView = "location"
    state.lastLocationType = "fishing"
    state.lastLocation = loc.name
}

const visitSellAllUserFish = async (state, page, url) => {
    await fetchInventory(state)
}

export const setupFishing = state => {
    state.addPageFilter("https://farmrpg.com/worker.php?go=castnet&id=*", visitNetResults)
    state.addPageFilter("https://farmrpg.com/fishing.php?*", visitFishing)
    state.addPageFilter("https://farmrpg.com/worker.php?go=sellalluserfish", visitSellAllUserFish)
}
