use anchor_lang::prelude::*;

declare_id!("AJLrzVsDA8LKYbMmd2ncXjUJeUwiXAVJwELFVoxmhCAf");

#[program]
pub mod solana_twitter {
    use super::*;

    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();
        if topic.chars().count() > 50
        {
            return Err(error!(ErrorCode::TopicTooLong))
        }
        if content.chars().count() > 280
        {
            return Err(error!(ErrorCode::ContentTooLong))
        }
        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.topic = topic;
        tweet.content = content;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendTweet<'info>{
    #[account(init, payer = author, space = Tweet::LEN)]
    pub tweet: Account<'info,Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info,System>,
}

#[account]
pub struct Tweet{
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}
const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_TOPIC_LENGTH: usize = 50 * 4;
const MAX_CONTENT_LENGTH: usize = 280 * 4;

impl Tweet{
    const LEN: usize = DISCRIMINATOR_LENGTH
                    + PUBLIC_KEY_LENGTH
                    + TIMESTAMP_LENGTH
                    + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH
                    + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH;
}

#[error_code]
pub enum ErrorCode{

    #[msg("Topic length can't be more than 50")]
    TopicTooLong,
    #[msg("Content length can't be more than 280")]
    ContentTooLong,
}
