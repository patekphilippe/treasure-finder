/**
 * The second look of the 1:100 000 profile: an enlarged close-up around one spot the first reading
 * marked, and only what is printed at its centre. A village name read as a place shows here as
 * plain letters and is not confirmed. Answers with the 1:100 000 schema (an empty list: nothing).
 */
export const sheet100CheckPrompt = (w: number, h: number, res: number) =>
  `This is an enlarged close-up of a 1:100 000 topographic sheet (Karte des Deutschen Reiches or WIG), ${w} × ${h} pixels, 1 pixel = ${res.toFixed(1)} m, centred on a spot another reading marked. Look only at the centre (the middle third of the image).

If a place is printed there, report that one object with the centre of its symbol:
- black house blocks of a village or hamlet → "wies";
- mill: a small wheel or cog, "M.", "Wm.", "Mühle" → "mlyn";
- inn: "Whs.", "Wirtsh.", "Krug", "Kr.", "Kretscham", "Gasth." → "karczma";
- manor farm: "Gut", "Vw.", "Vorw.", "Dom." with its buildings → "folwark";
- forester's house: "Fh.", "Försterei" → "lesniczowka";
- brickworks: "Zgl.", "Ziegelei" → "cegielnia";
- church or chapel: a cross on a small circle or square → "kosciol";
- glassworks "Glash.", tar kiln "Teerofen", ford "Furt" → "huta", "smolarnia", "brod".

If the centre shows only letters of a village, town, field or forest name, a number, a road, a river, contour lines, hachures or empty paper, report nothing: an empty "objects" list. Be strict: a big name in capitals or spaced letters is never a place; when unsure, report nothing. Answer in the required JSON format.`;
