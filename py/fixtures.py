import json
import re
from pathlib import Path
from typing import Iterable, Optional

import attr
from frozendict import frozendict

comment_re = re.compile(r"^//.*$")
export_re = re.compile(r"^export default ")

# This could be algorithmic but I'm lazy and this is faster.
item_case_mappings = {
    "sellPrice": "sell_price",
    "buyPrice": "buy_price",
    "craftPrice": "craft_price",
    "fleaMarket": "flea_market",
    "growthTime": "growth_time",
}


def load_fixture(name: str) -> list[dict]:
    # Load the data.
    fixture_path = Path(__file__) / ".." / ".." / "lib" / "fixtures" / f"{name}.js"
    raw_fixture = fixture_path.resolve().read_text().splitlines()
    # Remove any comments and then remove any leading blank lines.
    raw_fixture = [comment_re.sub("", line) for line in raw_fixture]
    while not raw_fixture[0].strip():
        raw_fixture.pop(0)
    # Remove the "export default " prefix.
    raw_fixture[0] = export_re.sub("", raw_fixture[0])
    # Parse it!
    return json.loads("\n".join(raw_fixture))


@attr.s(auto_attribs=True, frozen=True)
class Item:
    name: str
    id: str
    image: str
    recipe: frozendict[str, int] = attr.ib(default=frozendict(), converter=frozendict)
    sell_price: Optional[int] = None
    buy_price: Optional[int] = None
    craft_price: Optional[int] = None
    givable: bool = False
    rarity: Optional[str] = None
    xp: int = 0
    flea_market: bool = False
    mastery: bool = False
    event: bool = False
    growth_time: Optional[int] = None


def load_items() -> Iterable[Item]:
    for item in load_fixture("items"):
        yield Item(**{item_case_mappings.get(k, k): v for k, v in item.items()})


if __name__ == "__main__":
    items = [
        {item_case_mappings.get(k, k): v for k, v in item.items()}
        for item in load_fixture("items")
    ]
    data_path = Path(__file__) / ".." / "simulator" / "data" / "items.json"
    json.dump(items, data_path.resolve().open("w"), indent=2)
