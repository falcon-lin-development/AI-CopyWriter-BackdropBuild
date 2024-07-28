role_names=$(aws iam list-roles --query 'Roles[*].RoleName' --output json | jq -r '.[]')

for role_name in $role_names; do
    echo "Processing role: $role_name"

    # Detach managed policies
    policy_arns=$(aws iam list-attached-role-policies --role-name $role_name --query 'AttachedPolicies[*].PolicyArn' --output json | jq -r '.[]')
    for policy_arn in $policy_arns; do
        echo "Detaching policy $policy_arn from role $role_name"
        aws iam detach-role-policy --role-name $role_name --policy-arn $policy_arn
    done

    # Remove inline policies
    policy_names=$(aws iam list-role-policies --role-name $role_name --query 'PolicyNames' --output json | jq -r '.[]')
    for policy_name in $policy_names; do
        echo "Deleting inline policy $policy_name from role $role_name"
        aws iam delete-role-policy --role-name $role_name --policy-name $policy_name
    done

    # Delete instance profiles
    instance_profiles=$(aws iam list-instance-profiles-for-role --role-name $role_name --query 'InstanceProfiles[*].InstanceProfileName' --output json | jq -r '.[]')
    for instance_profile in $instance_profiles; do
        echo "Removing role $role_name from instance profile $instance_profile"
        aws iam remove-role-from-instance-profile --instance-profile-name $instance_profile --role-name $role_name
        echo "Deleting instance profile $instance_profile"
        aws iam delete-instance-profile --instance-profile-name $instance_profile
    done

    # Finally, delete the role
    echo "Deleting role $role_name"
    aws iam delete-role --role-name $role_name
done
