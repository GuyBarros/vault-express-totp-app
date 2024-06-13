export VAULT_ADDR=""
export VAULT_TOKEN=""
export VAULT_NAMESPACE=""

vault secrets enable totp


vault policy write totp-policy - << EOF

# create the keys that will be used in mfa (i.e. emails)
path "totp/keys/+" {
  capabilities = ["read", "create", "update"]
}

# check the mfa codes 
path "totp/code/+" {
  capabilities = ["create", "update"]
}

EOF

#To create a token that uses the above policy, you can use:
vault token create -policy=totp-policy

# to test via cli
# vault write totp/keys/cli@test.com generate=true account_name=cli@test.com issuer=Vault
# vault read totp/code/cli@test.com
# vault write totp/code/cli@test.com code=251073