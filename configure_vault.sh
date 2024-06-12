export VAULT_ADDR=""
export VAULT_TOKEN=""

vault secrets enable totp


vault policy write totp-policy - << EOF

path "totp/code/+" {
  capabilities = ["create", "update"]
}

path "totp/keys/+" {
  capabilities = ["read", "create", "update"]
}

EOF

#To create a token that uses the above policy, you can use:
vault token create -policy=totp-policy