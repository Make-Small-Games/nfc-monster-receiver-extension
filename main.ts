let Test_Monster: Sprite = null

NFCMonster.setRadioGroup(42)

NFCMonster.onMonsterReceived(function () {

    if (Test_Monster) {
        Test_Monster.setImage(
            NFCMonster.monsterImage()
        )
    } else {
        Test_Monster = sprites.create(
            NFCMonster.monsterImage(),
            SpriteKind.Player
        )

        Test_Monster.setPosition(
            80,
            60
        )
    }

    game.splash(
        "TYPE " +
        NFCMonster.type() +
        " FACING " +
        NFCMonster.facing(),

        "H " +
        NFCMonster.health() +
        " A " +
        NFCMonster.attack() +
        " S " +
        NFCMonster.speed()
    )

})

scene.setBackgroundColor(13)