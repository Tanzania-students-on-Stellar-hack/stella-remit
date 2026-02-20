#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token};

#[derive(Clone)]
#[contracttype]
pub struct Escrow {
    pub creator: Address,
    pub recipient: Address,
    pub amount: i128,
    pub deadline: u64,
    pub released: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Escrow(u64),
    Counter,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Create a new escrow
    pub fn create_escrow(
        env: Env,
        creator: Address,
        recipient: Address,
        token_address: Address,
        amount: i128,
        deadline: u64,
    ) -> u64 {
        creator.require_auth();

        // Get and increment counter
        let counter_key = DataKey::Counter;
        let escrow_id: u64 = env.storage().instance().get(&counter_key).unwrap_or(0);
        env.storage().instance().set(&counter_key, &(escrow_id + 1));

        // Transfer tokens from creator to contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&creator, &env.current_contract_address(), &amount);

        // Store escrow data
        let escrow = Escrow {
            creator: creator.clone(),
            recipient: recipient.clone(),
            amount,
            deadline,
            released: false,
        };

        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);
        
        escrow_id
    }

    /// Release escrow to recipient
    pub fn release(env: Env, escrow_id: u64, token_address: Address) {
        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env.storage().instance().get(&key)
            .expect("Escrow not found");

        // Only recipient can release
        escrow.recipient.require_auth();

        // Check if already released
        if escrow.released {
            panic!("Escrow already released");
        }

        // Check deadline
        let current_time = env.ledger().timestamp();
        if current_time < escrow.deadline {
            panic!("Deadline not reached");
        }

        // Transfer tokens to recipient
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.recipient,
            &escrow.amount,
        );

        // Mark as released
        escrow.released = true;
        env.storage().instance().set(&key, &escrow);
    }

    /// Refund escrow to creator (if deadline passed and not released)
    pub fn refund(env: Env, escrow_id: u64, token_address: Address) {
        let key = DataKey::Escrow(escrow_id);
        let mut escrow: Escrow = env.storage().instance().get(&key)
            .expect("Escrow not found");

        // Only creator can refund
        escrow.creator.require_auth();

        // Check if already released
        if escrow.released {
            panic!("Escrow already released");
        }

        // Check deadline passed
        let current_time = env.ledger().timestamp();
        if current_time <= escrow.deadline {
            panic!("Deadline not passed yet");
        }

        // Transfer tokens back to creator
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.creator,
            &escrow.amount,
        );

        // Mark as released
        escrow.released = true;
        env.storage().instance().set(&key, &escrow);
    }

    /// Get escrow details
    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        let key = DataKey::Escrow(escrow_id);
        env.storage().instance().get(&key).expect("Escrow not found")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_create_and_release_escrow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token = Address::generate(&env);
        let amount = 1000i128;
        let deadline = env.ledger().timestamp() + 3600;

        env.mock_all_auths();

        let escrow_id = client.create_escrow(&creator, &recipient, &token, &amount, &deadline);
        assert_eq!(escrow_id, 0);

        let escrow = client.get_escrow(&escrow_id);
        assert_eq!(escrow.amount, amount);
        assert_eq!(escrow.released, false);
    }
}
