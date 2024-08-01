module 0xYourAccountAddress::GuessTheNumber {
    use std::signer;
    use std::vector;
    use std::string;
    use std::option;

    struct Game has key {
        number_to_guess: u8,
        max_attempts: u8,
        attempts: u8,
        guessed_numbers: vector<u8>,
        is_finished: bool,
        winner: option::Option<address>,
    }

    public fun create_game(account: &signer, number: u8, max_attempts: u8) {
        assert!(number >= 1 && number <= 100, 1);
        let game = Game {
            number_to_guess: number,
            max_attempts: max_attempts,
            attempts: 0,
            guessed_numbers: vector::empty<u8>(),
            is_finished: false,
            winner: option::none<address>(),
        };
        move_to(account, game);
    }

    public fun guess_number(account: &signer, number: u8) {
        assert!(number >= 1 && number <= 100, 2);
        let game = borrow_global_mut<Game>(signer::address_of(account));
        assert!(!game.is_finished, 3);
        game.attempts = game.attempts + 1;
        vector::push_back(&mut game.guessed_numbers, number);
        if (number == game.number_to_guess) {
            game.is_finished = true;
            game.winner = option::some(signer::address_of(account));
        } else if (game.attempts >= game.max_attempts) {
            game.is_finished = true;
        }
    }

    public fun get_game_status(account: address): (u8, u8, vector<u8>, bool, option::Option<address>) {
        let game = borrow_global<Game>(account);
        (game.number_to_guess, game.attempts, game.guessed_numbers, game.is_finished, game.winner)
    }
}

