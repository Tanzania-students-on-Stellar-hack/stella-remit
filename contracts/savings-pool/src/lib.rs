#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, token};

#[derive(Clone)]
#[contracttype]
pub struct SavingsPool {
    pub name: String,
    pub members: Vec<Address>,
    pub contribution_amount: i128,
    pub current_round: u32,
    pub total_balance: i128,
    pub payout_interval: u64, // seconds between payouts
    pub last_payout: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Pool(u64),
    Counter,
}

#[contract]
pub struct SavingsPoolContract;

#[contractimpl]
impl SavingsPoolContract {
    /// Create a new savings pool (chama/ROSCA)
    pub fn create_pool(
        env: Env,
        name: String,
        members: Vec<Address>,
        contribution_amount: i128,
        payout_interval: u64,
    ) -> u64 {
        // First member must authorize
        members.get(0).unwrap().require_auth();

        let counter_key = DataKey::Counter;
        let pool_id: u64 = env.storage().instance().get(&counter_key).unwrap_or(0);
        env.storage().instance().set(&counter_key, &(pool_id + 1));

        let pool = SavingsPool {
            name,
            members,
            contribution_amount,
            current_round: 0,
            total_balance: 0,
            payout_interval,
            last_payout: env.ledger().timestamp(),
        };

        env.storage().instance().set(&DataKey::Pool(pool_id), &pool);
        pool_id
    }

    /// Member contributes to pool
    pub fn contribute(
        env: Env,
        pool_id: u64,
        member: Address,
        token_address: Address,
        amount: i128,
    ) {
        member.require_auth();

        let key = DataKey::Pool(pool_id);
        let mut pool: SavingsPool = env.storage().instance().get(&key)
            .expect("Pool not found");

        // Verify member is in pool
        let mut is_member = false;
        for i in 0..pool.members.len() {
            if pool.members.get(i).unwrap() == member {
                is_member = true;
                break;
            }
        }
        if !is_member {
            panic!("Not a pool member");
        }

        // Transfer tokens to contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&member, &env.current_contract_address(), &amount);

        pool.total_balance += amount;
        env.storage().instance().set(&key, &pool);
    }

    /// Automatic payout to next member in rotation
    pub fn distribute_payout(
        env: Env,
        pool_id: u64,
        token_address: Address,
    ) {
        let key = DataKey::Pool(pool_id);
        let mut pool: SavingsPool = env.storage().instance().get(&key)
            .expect("Pool not found");

        // Check if payout interval has passed
        let current_time = env.ledger().timestamp();
        if current_time < pool.last_payout + pool.payout_interval {
            panic!("Payout interval not reached");
        }

        // Calculate payout amount (all contributions for this round)
        let payout_amount = pool.contribution_amount * pool.members.len() as i128;

        if pool.total_balance < payout_amount {
            panic!("Insufficient balance for payout");
        }

        // Get recipient (rotating through members)
        let recipient_index = (pool.current_round as u32) % pool.members.len();
        let recipient = pool.members.get(recipient_index).unwrap();

        // Transfer payout
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &payout_amount,
        );

        // Update pool state
        pool.total_balance -= payout_amount;
        pool.current_round += 1;
        pool.last_payout = current_time;
        env.storage().instance().set(&key, &pool);
    }

    /// Get pool details
    pub fn get_pool(env: Env, pool_id: u64) -> SavingsPool {
        let key = DataKey::Pool(pool_id);
        env.storage().instance().get(&key).expect("Pool not found")
    }

    /// Check if payout is ready
    pub fn is_payout_ready(env: Env, pool_id: u64) -> bool {
        let key = DataKey::Pool(pool_id);
        let pool: SavingsPool = env.storage().instance().get(&key)
            .expect("Pool not found");
        
        let current_time = env.ledger().timestamp();
        current_time >= pool.last_payout + pool.payout_interval
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_create_pool() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SavingsPoolContract);
        let client = SavingsPoolContractClient::new(&env, &contract_id);

        let member1 = Address::generate(&env);
        let member2 = Address::generate(&env);
        let mut members = Vec::new(&env);
        members.push_back(member1.clone());
        members.push_back(member2);

        env.mock_all_auths();

        let pool_id = client.create_pool(
            &String::from_str(&env, "Test Pool"),
            &members,
            &100i128,
            &86400u64, // 1 day
        );

        assert_eq!(pool_id, 0);

        let pool = client.get_pool(&pool_id);
        assert_eq!(pool.contribution_amount, 100);
        assert_eq!(pool.current_round, 0);
    }
}
