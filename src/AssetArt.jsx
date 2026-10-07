import { isHumanType, getHumanSettings } from "./humans.js";
import { creaturePreset, isCreatureType } from "./creatures.js";

export default function AssetArt({
  type,
  primary = "#9ebcab",
  accent = "#dcc399",
  creature,
  human,
}) {
  const common = { stroke: "none" };
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`asset-art art-${type}`}
      {...common}
    >
      <ellipse cx="50" cy="88" rx="23" ry="4" fill="#233d31" opacity=".07" />
      {isHumanType(type) && (
        <HumanArt type={type} primary={primary} accent={accent} human={human} />
      )}
      {isCreatureType(type) && (
        <CreatureArt
          type={type}
          primary={primary}
          accent={accent}
          creature={creature}
        />
      )}
      {type === "sword" && (
        <g transform="rotate(28 50 50)">
          <path d="M42 56V21l8-13 8 13v35Z" fill={primary} />
          <path d="m50 8 8 13v35h-8Z" fill="#fff" opacity=".25" />
          <path d="m31 55 19-4 19 4 2 7-21-4-21 4Z" fill={accent} />
          <rect x="46" y="59" width="8" height="22" rx="2" fill="#596151" />
          <path d="M46 64h8m-8 6h8m-8 6h8" stroke={accent} strokeWidth="2" />
          <path d="m50 81 7 5-7 6-7-6Z" fill={accent} />
          <path d="m50 52 4 4-4 4-4-4Z" fill={primary} />
        </g>
      )}
      {type === "shield" && (
        <g>
          <path d="m50 12 28 10-3 40-25 24-25-24-3-40Z" fill={accent} />
          <path d="m50 18 22 8-3 33-19 20-19-20-3-33Z" fill={primary} />
          <path d="M50 18v61" stroke={accent} strokeWidth="4" />
          <path d="M29 41h42" stroke={accent} strokeWidth="4" />
          <path d="m50 32 11 13-11 13-11-13Z" fill={accent} />
          <path d="m50 32 11 13-11 13Z" fill="#fff" opacity=".18" />
        </g>
      )}
      {type === "tree" && (
        <g>
          <path d="M45 62h10v26H45Z" fill={accent} />
          <path d="m50 22 32 47H18Z" fill={primary} />
          <path d="m50 16 26 37H24Z" fill={primary} />
          <path d="m50 7 18 29H32Z" fill={primary} />
          <path
            d="m50 22 32 47H50Zm0-6 26 37H50Zm0-9 18 29H50Z"
            fill="#fff"
            opacity=".14"
          />
        </g>
      )}
      {type === "rock" && (
        <g>
          <path d="m18 72 9-34 25-14 25 13 10 37-28 11-28-4Z" fill={primary} />
          <path d="m27 38 25-14 6 32-40 16Z" fill="#fff" opacity=".23" />
          <path d="m58 56 19-19 10 37-28 11Z" fill="#1a3125" opacity=".15" />
          <path d="m52 24 25 13-19 19Z" fill="#fff" opacity=".1" />
          <path d="m26 73 14-4 9 6-5 8-20-3Z" fill={accent} />
        </g>
      )}
      {type === "chest" && (
        <g>
          <path d="m21 38 42-10 23 12v37L44 89 21 75Z" fill={primary} />
          <path d="m44 50 42-10v37L44 89Z" fill="#253221" opacity=".2" />
          <path d="M21 38q0-23 22-15l22 11q-22-9-21 16Z" fill={primary} />
          <path d="m43 23 24-7q19 2 19 24L44 50q0-20-1-27Z" fill={primary} />
          <path
            d="m30 27 6 2v50l-6-3Zm29-4 6-2q13 2 13 21v37l-6 2V44q0-17-13-21Z"
            fill={accent}
          />
          <path
            d="m21 41 23 13 42-11"
            stroke={accent}
            strokeWidth="3"
            fill="none"
          />
          <path d="m55 51 9-2v12l-9 3Z" fill={accent} />
        </g>
      )}
      {type === "potion" && (
        <g>
          <path
            d="M42 18h16v23l16 15 4 18-11 13H33L22 74l4-18 16-15Z"
            fill={primary}
          />
          <path
            d="m42 41-16 15-4 18 11 13h9L32 73l5-20Z"
            fill="#fff"
            opacity=".2"
          />
          <path d="M40 12h20v14H40Z" fill={accent} />
          <path d="M39 31h22v6H39Z" fill={accent} />
          <path d="M40 59h22v20H40Z" fill={accent} />
          <path d="m51 62 6 7-6 7-6-7Z" fill="#607765" />
          <path d="M69 59 74 74l-7 13h-9l9-12Z" fill="#23372a" opacity=".13" />
        </g>
      )}
    </svg>
  );
}

function CreatureArt({ type, primary, accent, creature }) {
  const c = { ...creaturePreset(type).creature, ...creature };
  const quad = c.bodyPlan === "quadruped";
  const serpent = c.bodyPlan === "serpent";
  const bird = c.bodyPlan === "avian";
  const headX = quad ? 63 : 50,
    headY = quad ? 45 : 39;
  const headR = 18 * c.headSize;
  return (
    <g>
      {c.wings !== "none" && (
        <g fill={accent}>
          <path d="M38 48 14 30 6 43l9 7-3 11 17 5 12-9Z" />
          <path d="m62 48 24-18 8 13-9 7 3 11-17 5-12-9Z" />
        </g>
      )}
      {serpent ? (
        <path
          d="M47 51c-6 7 17 15 7 22S29 88 17 77c17 5 10-13 22-20"
          fill={primary}
        />
      ) : (
        <g>
          <ellipse
            cx={quad ? 43 : 50}
            cy="64"
            rx={(quad ? 26 : c.bodyPlan === "orb" ? 26 : 19) * c.bodyWidth}
            ry={quad ? 15 : 22}
            fill={primary}
          />
          <ellipse cx={quad ? 49 : 50} cy="67" rx="12" ry="15" fill={accent} />
          {(quad ? [25, 38, 56, 67] : [38, 62]).map((x) => (
            <ellipse key={x} cx={x} cy="82" rx="7" ry="5" fill={accent} />
          ))}
        </g>
      )}
      {c.tail !== "none" && (
        <path
          d={quad ? "M23 62Q6 47 13 42" : "M34 71Q17 67 22 58"}
          fill="none"
          stroke={accent}
          strokeWidth="7"
          strokeLinecap="round"
        />
      )}
      {c.crest !== "none" && (
        <path
          d={quad ? "m28 49 6-13 6 13 5-10 6 11" : "m38 29 6-13 6 11 7-11 6 14"}
          fill={c.crest === "leaves" ? "#617e61" : accent}
        />
      )}
      {c.ears !== "none" &&
        [-1, 1].map((sign) => (
          <g
            key={sign}
            transform={`rotate(${sign * 17} ${headX + sign * headR * 0.72} ${headY - headR * 0.55})`}
          >
            <ellipse
              cx={headX + sign * headR * 0.72}
              cy={headY - headR * (c.ears === "long" ? 1.15 : 0.7)}
              rx={c.ears === "round" ? 8 : 5}
              ry={c.ears === "long" ? 17 : 9}
              fill={primary}
            />
            <ellipse
              cx={headX + sign * headR * 0.72}
              cy={headY - headR * (c.ears === "long" ? 1.2 : 0.75)}
              rx="2.8"
              ry={c.ears === "long" ? 11 : 5}
              fill={accent}
            />
          </g>
        ))}
      {c.horns !== "none" && (
        <g fill={accent}>
          <path
            d={`m${headX - headR * 0.57} ${headY - headR * 0.7} -7-16 13 12Z`}
          />
          <path
            d={`m${headX + headR * 0.57} ${headY - headR * 0.7} 7-16-13 12Z`}
          />
        </g>
      )}
      <ellipse
        cx={headX}
        cy={headY}
        rx={headR}
        ry={headR * 0.9}
        fill={primary}
      />
      <ellipse
        cx={headX + headR * 0.28}
        cy={headY + headR * 0.23}
        rx={headR * 0.68}
        ry={headR * 0.48}
        fill="#fff"
        opacity=".1"
      />
      {bird ? (
        <path d={`m${headX - 4} ${headY + 5} 8 0-4 8Z`} fill={accent} />
      ) : (
        <g>
          <ellipse cx={headX} cy={headY + 9} rx="10" ry="6" fill={accent} />
          <path d={`m${headX - 3} ${headY + 6} 6 0-3 3Z`} fill="#364d3a" />
        </g>
      )}
      {(c.eyeCount === 1 ? [0] : [-1, 1]).map((sign) => (
        <g key={sign}>
          <ellipse
            cx={headX + sign * headR * 0.4}
            cy={headY}
            rx={c.eyeCount === 1 ? 6 : 4.5}
            ry={c.temperament > 0.6 ? 3.2 : 6}
            fill="#fff5df"
          />
          <ellipse
            cx={headX + sign * headR * 0.4}
            cy={headY + 0.2}
            rx="2.5"
            ry={c.temperament > 0.6 ? 2.3 : 4}
            fill="#344739"
          />
          <circle
            cx={headX + sign * headR * 0.4 - 0.8}
            cy={headY - 1.8}
            r="1"
            fill="#fff"
          />
        </g>
      ))}
      {c.eyeCount === 3 && (
        <g>
          <ellipse cx={headX} cy={headY - 9} rx="3.5" ry="4" fill="#fff5df" />
          <circle cx={headX} cy={headY - 9} r="2" fill="#344739" />
        </g>
      )}
      {c.temperament > 0.6 && (
        <path
          d={`M${headX - headR * 0.65} ${headY - 6}l8 3m${headR * 0.3} 0 8-3`}
          fill="none"
          stroke="#4b5d49"
          strokeWidth="2.5"
        />
      )}
      {c.element === "storm" && (
        <path
          d={`m${headX} ${headY - headR} 8-13-7 2 2-10-11 15 7-2Z`}
          fill={accent}
        />
      )}
      {c.element === "fire" && (
        <path
          d={`m${headX - 7} ${headY - headR} 4-12 3 6 5-9 3 15Z`}
          fill={accent}
        />
      )}
    </g>
  );
}

function HumanArt({ type, primary, accent, human }) {
  const h = getHumanSettings({ type, human }),
    top = human?.topColor || primary,
    trim = human?.accessoryColor || accent;
  const w = 11 * h.shoulderWidth,
    face = 8 * h.faceWidth;
  return (
    <g>
      {h.cape !== "none" && (
        <path d="M38 42 33 77 65 77 62 42Z" fill={top} opacity=".6" />
      )}
      <path d={`M${50 - w} 42 Q50 36 ${50 + w} 42 L59 65 H41Z`} fill={top} />
      <path d="M42 63H50L48 84H40ZM50 63H58L60 84H52Z" fill={h.bottomColor} />
      {h.top === "robe" || h.bottom === "skirt" ? (
        <path
          d="M40 60H60L64 79H36Z"
          fill={h.top === "robe" ? top : h.bottomColor}
        />
      ) : null}
      <path d="M39 82H48V88H37ZM52 82H61L63 88H52Z" fill={h.shoeColor} />
      <path
        d={`M${49 - w} 43 ${42 - w} 64 ${46 - w} 67 ${54 - w} 45ZM${51 + w} 43 ${58 + w} 64 ${54 + w} 67 ${46 + w} 45Z`}
        fill={h.sleeves === "none" ? h.skin : top}
      />
      <ellipse cx={44 - w} cy="66" rx="3" ry="4" fill={h.skin} />
      <ellipse cx={56 + w} cy="66" rx="3" ry="4" fill={h.skin} />
      <rect x="47" y="34" width="6" height="8" rx="2" fill={h.skin} />
      <ellipse cx="50" cy="29" rx={face} ry="11" fill={h.skin} />
      {h.hair !== "none" && (
        <path
          d={`M${50 - face - 1} 30V22Q50 13 ${50 + face + 1} 22V28L53 22 46 25Z`}
          fill={h.hairColor}
        />
      )}
      {["bob", "long", "braids"].includes(h.hair) && (
        <path
          d={`M${50 - face - 2} 23H${50 - face + 1}V${h.hair === "bob" ? 37 : 46}H${50 - face - 3}ZM${50 + face - 1} 23H${50 + face + 2}V${h.hair === "bob" ? 37 : 46}H${50 + face + 3}Z`}
          fill={h.hairColor}
        />
      )}
      <circle cx="46.5" cy="29" r="1.1" fill={h.eyeColor} />
      <circle cx="53.5" cy="29" r="1.1" fill={h.eyeColor} />
      <path
        d="M47 35Q50 37 53 35"
        fill="none"
        stroke={h.lipColor}
        strokeWidth="1"
      />
      {h.facialHair !== "none" && (
        <path d="M44 34Q50 40 56 34L54 40H46Z" fill={h.hairColor} />
      )}
      {h.top === "armor" && (
        <>
          <path
            d="M39 42 33 46 39 51 44 44ZM61 42 67 46 61 51 56 44Z"
            fill={trim}
          />
          <path d="M48 43H52V61H48Z" fill={trim} />
        </>
      )}
      {h.belt !== "none" && <path d="M41 60H59V63H41Z" fill={trim} />}
      {h.headwear === "wizard" && (
        <path d="M50 5 39 22H61ZM36 22H64V25H36Z" fill={top} />
      )}
      {h.headwear === "helmet" && (
        <path d="M40 26V20Q50 13 60 20V26L55 24H45Z" fill={trim} />
      )}
      {h.headwear === "crown" && (
        <path d="M41 19 41 13 46 17 50 11 54 17 59 13 59 19Z" fill={trim} />
      )}
      {h.glasses !== "none" && (
        <g fill="none" stroke={trim} strokeWidth="1">
          <circle cx="46.5" cy="29" r="3" />
          <circle cx="53.5" cy="29" r="3" />
          <path d="M49 29H51" />
        </g>
      )}
    </g>
  );
}
