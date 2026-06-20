import os
import re

form_files = [
    "src/app/(main)/dashboard/admin/disability-insurance-companies/_components/company-form.tsx",
    "src/app/(main)/dashboard/admin/life-insurance-companies/_components/company-form.tsx",
    "src/app/(main)/dashboard/admin/long-term-care-insurance/_components/insurance-form.tsx",
    "src/app/(main)/dashboard/admin/money-managers/_components/money-manager-form.tsx",
    "src/app/(main)/dashboard/admin/record-keepers/_components/record-keeper-form.tsx",
    "src/app/(main)/dashboard/crm/accounting-firms/_components/accounting-firm-form.tsx",
    "src/app/(main)/dashboard/crm/actuarial-firms/_components/actuarial-firm-form.tsx",
    "src/app/(main)/dashboard/crm/addresses/_components/address-dialog.tsx",
    "src/app/(main)/dashboard/crm/addresses/_components/address-form.tsx",
    "src/app/(main)/dashboard/crm/banks/_components/bank-form.tsx",
    "src/app/(main)/dashboard/crm/clients/_components/client-form.tsx",
    "src/app/(main)/dashboard/crm/companies/_components/company-form.tsx",
    "src/app/(main)/dashboard/crm/law-firms/_components/law-firm-form.tsx",
    "src/app/(main)/dashboard/crm/people/_components/person-form.tsx",
    "src/app/(main)/dashboard/crm/property-and-casualty/_components/property-and-casualty-form.tsx",
    "src/app/(main)/dashboard/crm/policies/_components/policy-form.tsx",
    "src/app/(main)/dashboard/crm/households/_components/household-form.tsx"
]

for file_path in form_files:
    full_path = os.path.join("c:\\dev_bag\\prestige-box", file_path)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        continue
    
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the FormValues type being used
    # e.g. import { type CompanyFormValues, CompanyFormSchema } from "@/types/crm"
    # or const form = useForm<CompanyFormValues>({
    
    match = re.search(r'const form = useForm<([A-Za-z]+FormValues)>', content)
    if not match:
        print(f"Could not find useForm<...FormValues> in {file_path}")
        continue
        
    form_values_type = match.group(1)
    form_input_type = form_values_type.replace("FormValues", "FormInput")
    
    # 1. Update the import
    content = content.replace(
        f"type {form_values_type},", 
        f"type {form_values_type},\n  type {form_input_type},"
    )
    # Also handle single-line imports if they exist without newline
    content = content.replace(
        f"type {form_values_type} ", 
        f"type {form_values_type}, type {form_input_type} "
    )
    
    # 2. Update useForm
    content = content.replace(
        f"useForm<{form_values_type}>",
        f"useForm<{form_input_type}, any, {form_values_type}>"
    )
    
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Updated {file_path}")
