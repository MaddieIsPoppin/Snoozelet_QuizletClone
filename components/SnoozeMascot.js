"use client";

export default function SnoozeMascot({
  variant = "normal",
  message = null,
  mood = "happy",
}) {
  const faceOnly = ["coach", "mini", "logo"].includes(variant);

  return (
    <div
      className={`snoo-giraffe-wrap snoo-${variant} snoo-${mood}`}
    >
      {message ? (
        <div className="snoo-speech">
          {message}
        </div>
      ) : null}

      <div className="snoo-giraffe">
        <svg
          viewBox={faceOnly ? "0 0 220 215" : "0 0 220 520"}
          role="img"
          aria-label="Snoo the giraffe"
        >
          {/* LONG NECK */}
          <path
            className="snoo-neck"
            d="
              M83 196
              C79 270 76 365 78 510
              L145 510
              C143 370 142 270 137 196
              Z
            "
          />

          {/* NECK SPOTS */}
          <path
            className="snoo-spot"
            d="
              M84 250
              C101 240 117 246 123 260
              C129 277 119 291 99 291
              C85 286 79 270 84 250
              Z
            "
          />

          <path
            className="snoo-spot"
            d="
              M113 318
              C126 309 142 316 144 331
              L145 371
              C126 374 111 362 108 346
              C106 333 108 325 113 318
              Z
            "
          />

          <path
            className="snoo-spot"
            d="
              M77 398
              C91 389 111 397 116 414
              C120 431 109 445 82 447
              Z
            "
          />

          <path
            className="snoo-spot"
            d="
              M117 470
              C129 463 139 469 144 480
              L145 510
              L111 510
              C105 492 107 477 117 470
              Z
            "
          />

          {/* LEFT EAR */}
          <path
            className="snoo-ear"
            d="
              M68 93
              C37 69 12 80 17 112
              C21 137 47 143 78 127
              Z
            "
          />

          {/* RIGHT EAR */}
          <path
            className="snoo-ear"
            d="
              M151 93
              C182 69 207 80 202 112
              C198 137 172 143 141 127
              Z
            "
          />

          {/* OSSICON LEFT */}
          <path
            className="snoo-horn"
            d="
              M75 77
              L59 29
              C56 20 61 11 70 8
              C80 5 89 12 90 22
              L91 72
              Z
            "
          />

          <ellipse
            className="snoo-horn-tip"
            cx="67"
            cy="19"
            rx="17"
            ry="15"
          />

          {/* OSSICON RIGHT */}
          <path
            className="snoo-horn"
            d="
              M128 72
              L132 22
              C133 12 142 5 152 8
              C161 11 166 20 163 29
              L147 77
              Z
            "
          />

          <ellipse
            className="snoo-horn-tip"
            cx="155"
            cy="19"
            rx="17"
            ry="15"
          />

          {/* HEAD */}
          <path
            className="snoo-head"
            d="
              M67 79
              C81 64 103 59 112 59
              C122 59 143 64 156 80
              C167 94 169 123 163 143
              C158 160 144 171 134 178
              L87 178
              C76 170 62 159 58 143
              C52 122 56 94 67 79
              Z
            "
          />

          {/* FACE SPOTS */}
          <circle
            className="snoo-face-spot"
            cx="81"
            cy="99"
            r="9"
          />

          <circle
            className="snoo-face-spot"
            cx="143"
            cy="99"
            r="9"
          />

          {/* EYES */}
          <g className="snoo-eyes">
            <ellipse
              className="snoo-eye"
              cx="86"
              cy="118"
              rx="8"
              ry="10"
            />

            <ellipse
              className="snoo-eye"
              cx="137"
              cy="118"
              rx="8"
              ry="10"
            />
          </g>

          {/* MUZZLE */}
          <path
            className="snoo-muzzle"
            d="
              M51 143
              C56 127 77 121 111 121
              C146 121 167 127 172 144
              C179 165 162 191 111 194
              C61 191 44 165 51 143
              Z
            "
          />

          {/* NOSTRILS */}
          <path
            className="snoo-nostril"
            d="
              M73 157
              C71 149 67 147 62 151
              C58 154 59 161 61 165
            "
          />

          <path
            className="snoo-nostril"
            d="
              M149 157
              C151 149 155 147 160 151
              C164 154 163 161 161 165
            "
          />

          {/* SMALL SMILE */}
          <path
            className="snoo-smile"
            d="
              M101 171
              C108 176 115 176 122 171
            "
          />
        </svg>
      </div>
    </div>
  );
}
