/**
 * NFC Monster receiver extension.
 *
 * Receives NFC monster data sent over radio
 * by the Make Small Games NFC micro:bit reader.
 */

//% weight=95 color=#6f5cff block="NFC Monster"
namespace NFCMonster {

    // ============================================================
    // PROTOCOL
    // ============================================================

    const PIXEL_CHARACTERS =
        "0123456789ABCDEF"

    const DATA_CHARACTERS =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const FACING_CODES =
        "LFR"

    const ROW_CODES =
        "ABCDEFGHIJKLMNOP"


    // ============================================================
    // RECEIVER STATE
    // ============================================================

    let Receiver_Started =
        false

    let Radio_Group =
        42


    // ------------------------------------------------------------
    // INCOMING MONSTER
    //
    // This is kept separate from the last completed monster.
    //
    // If a new transmission fails, the previously received
    // monster remains available to the game.
    // ------------------------------------------------------------

    let Incoming_Rows: string[] =
        []

    let Incoming_Row_Received: boolean[] =
        []

    let Incoming_Rows_Received =
        0

    let Incoming_Metadata_Received =
        false

    let Incoming_Facing =
        ""

    let Incoming_Type =
        ""

    let Incoming_Health =
        0

    let Incoming_Attack =
        0

    let Incoming_Speed =
        0

    let Incoming_Reserved =
        ""


    // ============================================================
    // LAST COMPLETE MONSTER
    // ============================================================

    let Last_Monster_Image: Image =
        null

    let Last_Monster_Facing =
        ""

    let Last_Monster_Type =
        ""

    let Last_Monster_Health =
        0

    let Last_Monster_Attack =
        0

    let Last_Monster_Speed =
        0

    let Last_Monster_Reserved =
        ""

    let Monster_Available =
        false


    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    let Received_Handlers: (() => void)[] =
        []


    // ============================================================
    // RESET INCOMING DATA
    // ============================================================

    function resetIncomingMonster() {

        Incoming_Rows =
            []

        Incoming_Row_Received =
            []

        Incoming_Rows_Received =
            0

        Incoming_Metadata_Received =
            false

        Incoming_Facing =
            ""

        Incoming_Type =
            ""

        Incoming_Health =
            0

        Incoming_Attack =
            0

        Incoming_Speed =
            0

        Incoming_Reserved =
            ""


        for (
            let row = 0;
            row < 16;
            row++
        ) {

            Incoming_Rows.push(
                ""
            )

            Incoming_Row_Received.push(
                false
            )

        }

    }


    // ============================================================
    // CONVERT PIXEL CHARACTER TO COLOR
    // ============================================================

    function pixelCharacterToColor(
        character: string
    ) {

        return PIXEL_CHARACTERS.indexOf(
            character.toUpperCase()
        )

    }


    // ============================================================
    // CONVERT 0-Z CHARACTER TO NUMBER
    //
    // 0-9 = 0-9
    // A   = 10
    // B   = 11
    // ...
    // Z   = 35
    // ============================================================

    function dataCharacterToNumber(
        character: string
    ) {

        return DATA_CHARACTERS.indexOf(
            character.toUpperCase()
        )

    }


    // ============================================================
    // CHECK GENERIC DATA CHARACTER
    // ============================================================

    function validDataCharacter(
        character: string
    ) {

        return DATA_CHARACTERS.indexOf(
            character.toUpperCase()
        ) >= 0

    }


    // ============================================================
    // CHECK SPRITE ROW
    // ============================================================

    function validRow(
        pixels: string
    ) {

        if (
            pixels.length != 16
        ) {

            return false

        }


        for (
            let x = 0;
            x < 16;
            x++
        ) {

            let color =
                pixelCharacterToColor(
                    pixels.substr(
                        x,
                        1
                    )
                )


            if (
                color < 0 ||
                color > 15
            ) {

                return false

            }

        }


        return true

    }


    // ============================================================
    // READ METADATA
    //
    // 13 characters:
    //
    // Facing
    // Type
    // Health
    // Attack
    // Speed
    // 8 reserved characters
    // ============================================================

    function readMetadata(
        metadata: string
    ) {

        metadata =
            metadata.toUpperCase()


        if (
            metadata.length != 13
        ) {

            return false

        }


        let facing =
            metadata.substr(
                0,
                1
            )


        if (
            FACING_CODES.indexOf(
                facing
            ) < 0
        ) {

            return false

        }


        let type =
            metadata.substr(
                1,
                1
            )


        if (
            !(validDataCharacter(
                type
            ))
        ) {

            return false

        }


        let healthCharacter =
            metadata.substr(
                2,
                1
            )

        let attackCharacter =
            metadata.substr(
                3,
                1
            )

        let speedCharacter =
            metadata.substr(
                4,
                1
            )


        if (
            !(validDataCharacter(
                healthCharacter
            ))
        ) {

            return false

        }


        if (
            !(validDataCharacter(
                attackCharacter
            ))
        ) {

            return false

        }


        if (
            !(validDataCharacter(
                speedCharacter
            ))
        ) {

            return false

        }


        let reserved =
            metadata.substr(
                5,
                8
            )


        for (
            let position = 0;
            position < 8;
            position++
        ) {

            if (
                !(validDataCharacter(
                    reserved.substr(
                        position,
                        1
                    )
                ))
            ) {

                return false

            }

        }


        Incoming_Facing =
            facing

        Incoming_Type =
            type

        Incoming_Health =
            dataCharacterToNumber(
                healthCharacter
            )

        Incoming_Attack =
            dataCharacterToNumber(
                attackCharacter
            )

        Incoming_Speed =
            dataCharacterToNumber(
                speedCharacter
            )

        Incoming_Reserved =
            reserved

        Incoming_Metadata_Received =
            true


        return true

    }


    // ============================================================
    // BUILD MONSTER IMAGE
    // ============================================================

    function buildMonsterImage() {

        let monsterImage =
            image.create(
                16,
                16
            )


        for (
            let y = 0;
            y < 16;
            y++
        ) {

            let row =
                Incoming_Rows[y]


            for (
                let x = 0;
                x < 16;
                x++
            ) {

                let character =
                    row.substr(
                        x,
                        1
                    )


                let color =
                    pixelCharacterToColor(
                        character
                    )


                monsterImage.setPixel(
                    x,
                    y,
                    color
                )

            }

        }


        return monsterImage

    }


    // ============================================================
    // FINISH MONSTER
    // ============================================================

    function finishMonster() {

        if (
            Incoming_Rows_Received != 16
        ) {

            return

        }


        if (
            !(Incoming_Metadata_Received)
        ) {

            return

        }


        // --------------------------------------------------------
        // Only now replace the last completed monster.
        // --------------------------------------------------------

        Last_Monster_Image =
            buildMonsterImage()

        Last_Monster_Facing =
            Incoming_Facing

        Last_Monster_Type =
            Incoming_Type

        Last_Monster_Health =
            Incoming_Health

        Last_Monster_Attack =
            Incoming_Attack

        Last_Monster_Speed =
            Incoming_Speed

        Last_Monster_Reserved =
            Incoming_Reserved

        Monster_Available =
            true


        // --------------------------------------------------------
        // Tell any game code that a complete monster arrived.
        // --------------------------------------------------------

        for (
            let index = 0;
            index < Received_Handlers.length;
            index++
        ) {

            Received_Handlers[index]()

        }

    }


    // ============================================================
    // HANDLE RADIO MESSAGE
    // ============================================================

    function handleRadioMessage(
        message: string
    ) {

        message =
            message.toUpperCase()


        // --------------------------------------------------------
        // START
        // --------------------------------------------------------

        if (
            message == "S"
        ) {

            resetIncomingMonster()

            return

        }


        // --------------------------------------------------------
        // END
        // --------------------------------------------------------

        if (
            message == "E"
        ) {

            finishMonster()

            return

        }


        // --------------------------------------------------------
        // METADATA
        //
        // Q + 13 characters
        // --------------------------------------------------------

        if (
            message.substr(
                0,
                1
            ) == "Q"
        ) {

            if (
                message.length != 14
            ) {

                return

            }


            readMetadata(
                message.substr(
                    1,
                    13
                )
            )


            return

        }


        // --------------------------------------------------------
        // SPRITE ROW
        //
        // A-P + 16 pixel characters
        // --------------------------------------------------------

        if (
            message.length != 17
        ) {

            return

        }


        let rowCode =
            message.substr(
                0,
                1
            )


        let row =
            ROW_CODES.indexOf(
                rowCode
            )


        if (
            row < 0 ||
            row > 15
        ) {

            return

        }


        let pixels =
            message.substr(
                1,
                16
            )


        if (
            !(validRow(
                pixels
            ))
        ) {

            return

        }


        if (
            !(Incoming_Row_Received[
                row
            ])
        ) {

            Incoming_Row_Received[
                row
            ] =
                true

            Incoming_Rows_Received +=
                1

        }


        Incoming_Rows[
            row
        ] =
            pixels

    }


    // ============================================================
    // START RADIO RECEIVER
    //
    // Only starts once.
    // ============================================================

    function ensureReceiverStarted() {

        if (
            Receiver_Started
        ) {

            return

        }


        Receiver_Started =
            true


        resetIncomingMonster()


        radio.onReceivedString(
            function (message) {

                handleRadioMessage(
                    message
                )

            }
        )

    }


    // ============================================================
    // PUBLIC BLOCKS
    // ============================================================


    /**
     * Sets the radio group used by the NFC Monster receiver.
     */
    //% blockId=nfcmonster_set_radio_group
    //% block="NFC Monster set radio group $radioGroup"
    //% radioGroup.defl=42
    //% radioGroup.min=0
    //% radioGroup.max=255
    //% weight=100
    export function setRadioGroup(
        radioGroup: number
    ) {

        ensureReceiverStarted()


        Radio_Group =
            radioGroup


        radio.setGroup(
            Radio_Group
        )


        radio.setTransmitPower(
            7
        )

    }


    /**
     * Runs when a complete NFC monster is received.
     */
    //% blockId=nfcmonster_on_received
    //% block="on NFC monster received"
    //% weight=95
    export function onMonsterReceived(
        handler: () => void
    ) {

        ensureReceiverStarted()


        Received_Handlers.push(
            handler
        )

    }


    /**
     * Returns true after at least one complete monster has been received.
     */
    //% blockId=nfcmonster_has_monster
    //% block="NFC monster available"
    //% weight=90
    export function hasMonster() {

        return Monster_Available

    }


    /**
     * Returns the last received monster image.
     */
    //% blockId=nfcmonster_image
    //% block="NFC monster image"
    //% weight=85
    export function monsterImage() {

        if (
            Last_Monster_Image
        ) {

            return Last_Monster_Image

        }


        return image.create(
            16,
            16
        )

    }


    /**
     * Returns L, F, or R.
     */
    //% blockId=nfcmonster_facing
    //% block="NFC monster facing"
    //% weight=80
    export function facing() {

        return Last_Monster_Facing

    }


    /**
     * Returns the one-character monster type code.
     */
    //% blockId=nfcmonster_type
    //% block="NFC monster type"
    //% weight=75
    export function type() {

        return Last_Monster_Type

    }


    /**
     * Returns the monster Health stat.
     */
    //% blockId=nfcmonster_health
    //% block="NFC monster health"
    //% weight=70
    export function health() {

        return Last_Monster_Health

    }


    /**
     * Returns the monster Attack stat.
     */
    //% blockId=nfcmonster_attack
    //% block="NFC monster attack"
    //% weight=65
    export function attack() {

        return Last_Monster_Attack

    }


    /**
     * Returns the monster Speed stat.
     */
    //% blockId=nfcmonster_speed
    //% block="NFC monster speed"
    //% weight=60
    export function speed() {

        return Last_Monster_Speed

    }


    /**
     * Returns all eight reserved future characters.
     */
    //% blockId=nfcmonster_reserved
    //% block="NFC monster reserved data"
    //% weight=55
    export function reservedData() {

        return Last_Monster_Reserved

    }


    /**
     * Returns one reserved field, numbered 1 through 8.
     */
    //% blockId=nfcmonster_extra_field
    //% block="NFC monster extra field $field"
    //% field.defl=1
    //% field.min=1
    //% field.max=8
    //% weight=50
    export function extraField(
        field: number
    ) {

        if (
            field < 1 ||
            field > 8
        ) {

            return ""

        }


        return Last_Monster_Reserved.substr(
            field - 1,
            1
        )

    }

}