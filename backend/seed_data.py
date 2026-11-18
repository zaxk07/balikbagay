"""Seed campus items (mirrors frontend/src/data/seed.ts) and a small OpenCV renderer
that draws a simplified product image per item kind so visual features exist without
shipping binary assets."""
from __future__ import annotations

import cv2
import numpy as np

BG = "#efe9dd"

SEED_ITEMS: list[dict] = [
    dict(id="bb-001", title="Black Aquaflask Tumbler", category="Drinkware", building="CICS", spot="2nd floor corridor bench",
         description="Black insulated Aquaflask tumbler with a carry handle and a small dent near the bottom. Silver lid, stainless steel interior.",
         date="2026-11-10", status="Unclaimed", kind="tumbler", colors=["#1c1c1f", "#8a8d93", "#c9ccd2"]),
    dict(id="bb-002", title="Pastel Blue Insulated Tumbler", category="Drinkware", building="Cafeteria", spot="Table near the rice counter",
         description="Light blue insulated tumbler with a flip straw lid and a sticker of a cat on the side. Water flask style.",
         date="2026-11-12", status="Unclaimed", kind="tumbler", colors=["#8fc3e6", "#f2f2f2", "#f7b6c8"]),
    dict(id="bb-003", title="Casio fx-991ES Scientific Calculator", category="Electronics", building="CEA", spot="Lobby, near the guard station",
         description="Black Casio scientific calculator fx-991ES Plus with a gray hard cover. Name label scratched off the back.",
         date="2026-11-11", status="Unclaimed", kind="calculator", colors=["#202226", "#9dbf9a", "#e8e8ea"]),
    dict(id="bb-004", title="White USB-C Phone Charger", category="Electronics", building="Library", spot="Outlet on 2nd floor study carrels",
         description="White 20W USB-C power adapter with a short braided cable still plugged in. Fast charger block.",
         date="2026-11-09", status="Unclaimed", kind="charger", colors=["#f4f4f2", "#2b2b2e", "#c9c9c4"]),
    dict(id="bb-005", title="Navy Blue Folding Umbrella", category="Accessories", building="CIT", spot="Umbrella stand at the entrance",
         description="Navy blue compact folding umbrella with a black plastic handle and a velcro strap. Automatic open button.",
         date="2026-11-13", status="Unclaimed", kind="umbrella", colors=["#1f3a73", "#16181d", "#8fa6d6"]),
    dict(id="bb-006", title="Red BatStateU ID Lanyard with Card", category="IDs & Keys", building="Gymnasium", spot="Bleachers, left side",
         description="Red lanyard with a BatStateU student ID card still attached and a metal clip. ID photo is of a male student.",
         date="2026-11-08", status="Claimed", kind="lanyard", colors=["#c0262d", "#f2f2f2", "#d9a21b"]),
    dict(id="bb-007", title="White Wireless Earbuds Case", category="Electronics", building="CICS", spot="Computer Lab 3 desk",
         description="White wireless earbuds in a small rounded charging case, Bluetooth, with a green LED. Case has scuff marks.",
         date="2026-11-14", status="Unclaimed", kind="earbuds", colors=["#f5f5f3", "#d6d6d1", "#3fb36b"]),
    dict(id="bb-008", title="Green Spiral Notebook", category="Stationery", building="Library", spot="Reading area, long table",
         description="Green spiral notebook with handwritten engineering notes inside, about 80 leaves and a white label on the cover.",
         date="2026-11-07", status="Unclaimed", kind="notebook", colors=["#2f7d4f", "#f6f3ea", "#c9d8ce"]),
    dict(id="bb-009", title="Red Flash Drive 32GB", category="Electronics", building="CEA", spot="Drafting room 204",
         description="Red USB flash drive 32GB with a metal connector and a keyring hole. Thumb drive with files for plates.",
         date="2026-11-15", status="Unclaimed", kind="flashdrive", colors=["#c62828", "#b9bcc2", "#1d1d1f"]),
    dict(id="bb-010", title="Brown Eyeglasses Case", category="Accessories", building="CIT", spot="Workshop bench",
         description="Brown hard shell eyeglasses case with a cleaning cloth inside and a metal clasp. Leather texture.",
         date="2026-11-06", status="Unclaimed", kind="glasscase", colors=["#7a4a2b", "#d9b48a", "#3b2616"]),
    dict(id="bb-011", title="Gray Pullover Hoodie", category="Apparel", building="Gymnasium", spot="Lockers, near court B",
         description="Gray pullover hoodie with a kangaroo pocket and white drawstrings. Size medium, left sleeve worn.",
         date="2026-11-05", status="Claimed", kind="hoodie", colors=["#8a8d93", "#f2f2f2", "#5d6068"]),
    dict(id="bb-012", title="Keys with Yellow Keychain", category="IDs & Keys", building="Cafeteria", spot="Counter by the cashier",
         description="Set of three keys on a steel ring with a yellow rubber tag keychain. Apartment key and a padlock key.",
         date="2026-11-12", status="Unclaimed", kind="keys", colors=["#f2c21b", "#b9bcc2", "#8a8d93"]),
    dict(id="bb-013", title="Beige Canvas Tote Bag", category="Bags", building="Library", spot="Under table at the entrance",
         description="Beige canvas tote bag with brown handles and a front pocket. Contains a folder and a pair of earphones.",
         date="2026-11-10", status="Unclaimed", kind="tote", colors=["#d8c7a3", "#7a4a2b", "#bda97f"]),
    dict(id="bb-014", title="Black Power Bank 10000mAh", category="Electronics", building="CEA", spot="Room 301, back row",
         description="Black portable power bank 10000mAh with four LED indicator lights and a USB-C port. Slim and rectangular.",
         date="2026-11-13", status="Unclaimed", kind="powerbank", colors=["#18181b", "#e0891d", "#5a5d66"]),
    dict(id="bb-015", title="Blue Notebook with Stickers", category="Stationery", building="CICS", spot="Room 105 desk",
         description="Blue ruled notebook with programming notes and laptop stickers on the cover. Spiral binding.",
         date="2026-11-14", status="Unclaimed", kind="notebook", colors=["#2a5db0", "#f6f3ea", "#f2c21b"]),
]


def _bgr(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return (b, g, r)


def render_item(kind: str, colors: list[str], bg: str = BG, size: int = 200) -> np.ndarray:
    """Draw a simplified silhouette of the item (200x200 design grid) and return a BGR image."""
    img = np.full((200, 200, 3), _bgr(bg), np.uint8)
    a, b, c = (_bgr(x) for x in colors)

    def rect(x0, y0, x1, y1, col):
        cv2.rectangle(img, (x0, y0), (x1, y1), col, -1, cv2.LINE_AA)

    def rrect(x0, y0, x1, y1, col, r=10):
        r = min(r, (x1 - x0) // 2, (y1 - y0) // 2)
        rect(x0 + r, y0, x1 - r, y1, col)
        rect(x0, y0 + r, x1, y1 - r, col)
        for cx, cy in ((x0 + r, y0 + r), (x1 - r, y0 + r), (x0 + r, y1 - r), (x1 - r, y1 - r)):
            cv2.circle(img, (cx, cy), r, col, -1, cv2.LINE_AA)

    def poly(pts, col):
        cv2.fillPoly(img, [np.array(pts, np.int32)], col, cv2.LINE_AA)

    if kind == "tumbler":
        rrect(68, 38, 132, 56, b, 6)
        cv2.ellipse(img, (100, 40), (22, 22), 0, 180, 360, b, 6, cv2.LINE_AA)
        poly([(70, 56), (130, 56), (122, 168), (114, 174), (86, 174), (78, 168)], a)
        rrect(76, 96, 124, 122, c, 4)
    elif kind == "calculator":
        rrect(58, 26, 142, 174, a, 10)
        rect(66, 36, 134, 62, b)
        for r in range(6):
            for col in range(5):
                rect(66 + col * 14, 72 + r * 15, 77 + col * 14, 82 + r * 15, (91, 95, 105) if r < 2 else c)
    elif kind == "charger":
        rrect(76, 150, 124, 172, c, 4)
        rrect(68, 60, 132, 154, a, 14)
        rrect(86, 44, 114, 64, b, 10)
        rect(92, 50, 108, 58, (17, 17, 17))
    elif kind == "umbrella":
        poly([(100, 18), (118, 50), (122, 100), (108, 142), (92, 142), (78, 100), (82, 50)], a)
        rect(90, 96, 110, 108, b)
        rect(97, 142, 103, 164, b)
        cv2.ellipse(img, (90, 172), (10, 10), 0, 0, 180, b, 8, cv2.LINE_AA)
    elif kind == "lanyard":
        cv2.line(img, (52, 14), (92, 98), a, 18, cv2.LINE_AA)
        cv2.line(img, (148, 14), (108, 98), a, 18, cv2.LINE_AA)
        rrect(68, 108, 132, 172, b, 6)
        rect(68, 108, 132, 124, a)
        cv2.circle(img, (100, 138), 8, c, -1, cv2.LINE_AA)
    elif kind == "earbuds":
        rrect(56, 70, 144, 152, a, 34)
        cv2.line(img, (56, 100), (144, 100), b, 3, cv2.LINE_AA)
        cv2.circle(img, (100, 124), 5, c, -1, cv2.LINE_AA)
        cv2.ellipse(img, (82, 46), (11, 15), 0, 0, 360, a, -1, cv2.LINE_AA)
        cv2.ellipse(img, (118, 46), (11, 15), 0, 0, 360, a, -1, cv2.LINE_AA)
        rect(86, 54, 92, 76, a)
        rect(108, 54, 114, 76, a)
    elif kind == "notebook":
        rrect(56, 24, 146, 172, a, 6)
        for i in range(11):
            rrect(50, 34 + i * 12, 64, 39 + i * 12, (194, 204, 201), 2)
        rect(76, 48, 132, 90, b)
        cv2.circle(img, (124, 150), 9, c, -1, cv2.LINE_AA)
    elif kind == "flashdrive":
        rect(82, 26, 118, 72, b)
        rrect(70, 70, 130, 170, a, 12)
        rect(70, 92, 130, 102, c)
    elif kind == "glasscase":
        rrect(36, 74, 164, 150, a, 30)
        cv2.line(img, (36, 112), (164, 112), c, 3, cv2.LINE_AA)
        rrect(90, 104, 110, 118, b, 4)
    elif kind == "hoodie":
        poly([(70, 34), (130, 34), (168, 66), (152, 100), (136, 90), (136, 170), (64, 170), (64, 90), (48, 100), (32, 66)], a)
        poly([(70, 34), (100, 70), (130, 34), (100, 24)], c)
        poly([(78, 124), (122, 124), (128, 152), (72, 152)], c)
    elif kind == "keys":
        cv2.circle(img, (100, 56), 26, c, 6, cv2.LINE_AA)
        rrect(84, 102, 116, 142, a, 8)
        poly([(52, 70), (64, 66), (80, 126), (68, 130)], b)
        poly([(148, 70), (136, 66), (120, 126), (132, 130)], b)
    elif kind == "tote":
        cv2.ellipse(img, (100, 74), (30, 44), 0, 180, 360, b, 7, cv2.LINE_AA)
        poly([(52, 70), (148, 70), (156, 170), (44, 170)], a)
        rect(70, 112, 130, 154, c)
    elif kind == "powerbank":
        rrect(46, 62, 154, 166, a, 14)
        for i in range(4):
            cv2.circle(img, (70 + i * 20, 86), 5, b, -1, cv2.LINE_AA)
        rect(70, 112, 130, 142, c)
    else:
        rect(60, 60, 140, 140, a)

    return cv2.resize(img, (size, size), interpolation=cv2.INTER_AREA) if size != 200 else img
