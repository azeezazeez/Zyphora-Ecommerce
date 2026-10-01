
              rounded-full

              bg-white
              hover:bg-neutral-50

              text-black

              border
              border-black/15

              hover:border-black/35

              shadow-[0_10px_25px_-5px_rgba(0,0,0,0.18),0_4px_10px_-2px_rgba(0,0,0,0.06)]

              hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.24)]

              hover:scale-105
              active:scale-95

              transition-all
              duration-200

              flex
              items-center
              justify-center

              sm:gap-2.5

              group
            "
            aria-label="Ask Zyphora AI"
          >
            {/* AI ICON */}

            <div
              className="
                w-8
                h-8

                sm:w-7
                sm:h-7

                rounded-full

                bg-black

                border
                border-black

                flex
                items-center
                justify-center

                shrink-0

                transition-transform

                group-hover:scale-105
              "
            >
              <Zap
                className="
                  w-4
                  h-4

                  sm:w-3.5
                  sm:h-3.5

                  text-white
                  fill-white
                "
              />
            </div>

            {/* AI LABEL */}

            <span
              className="
                hidden
                sm:inline

                text-sm
                font-semibold

                tracking-wide

                text-black

                select-none

                pr-1
              "
            >
              Ask Zyphora AI
            </span>

            {/* LIVE INDICATOR */}

            <span
              className="
                w-2
                h-2

                rounded-full

                bg-black

                ring-2
                ring-white

                animate-pulse

                absolute

                top-1
                right-1

                sm:static
                sm:ring-0
                sm:top-auto
                sm:right-auto
              "
              aria-hidden="true"
            />
          </button>
        </div>
      )}
