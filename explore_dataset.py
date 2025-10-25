#!/usr/bin/env python3
"""
Script to explore the mutual-funds-and-etfs dataset
"""
import json
try:
    from datasets import load_dataset
except ImportError:
    print("Installing datasets...")
    import subprocess
    subprocess.check_call(["pip", "install", "datasets", "-q"])
    from datasets import load_dataset

try:
    import pandas as pd
except ImportError:
    print("Installing pandas...")
    import subprocess
    subprocess.check_call(["pip", "install", "pandas", "-q"])
    import pandas as pd

print("Loading dataset from HuggingFace...")
print("-" * 80)

try:
    # Try different possible dataset names
    possible_names = [
        "stefanoleone992/mutual-funds-and-etfs",
        "stefanoleone992/european_funds_dataset_from_morningstar",
        "datasets/mutual-funds-etfs",
    ]
    
    dataset = None
    for name in possible_names:
        try:
            print(f"Trying: {name}")
            dataset = load_dataset(name)
            print(f"✓ Successfully loaded: {name}")
            break
        except Exception as e:
            print(f"  ✗ Failed: {str(e)[:100]}")
            continue
    
    if dataset is None:
        # Try loading with Kaggle through kagglehub
        print("\nTrying kagglehub approach...")
        import kagglehub
        dataset = kagglehub.dataset_load("stefanoleone992/mutual-funds-and-etfs")
        print("✓ Loaded via kagglehub")
    
    print("\n" + "=" * 80)
    print("DATASET STRUCTURE ANALYSIS")
    print("=" * 80)
    
    # Check if it's a DatasetDict (multiple splits)
    if isinstance(dataset, dict):
        # Multiple tables/splits
        print(f"\n📊 Dataset has {len(dataset)} tables/splits:")
        print("-" * 80)
        
        table_info = {}
        for key in dataset.keys():
            data = dataset[key]
            print(f"\n🔹 Table: '{key}'")
            print(f"   Rows: {len(data)}")
            print(f"   Columns: {data.column_names}")
            
            # Get data types
            df = data.to_pandas()
            print(f"   Data types:")
            for col, dtype in df.dtypes.items():
                print(f"      - {col}: {dtype}")
            
            # Show sample data
            print(f"\n   Sample data (first 3 rows):")
            print(df.head(3).to_string(index=False))
            print()
            
            table_info[key] = {
                'rows': len(data),
                'columns': data.column_names,
                'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()}
            }
        
        print("\n" + "=" * 80)
        print("RELATIONSHIP ANALYSIS")
        print("=" * 80)
        
        # Try to identify relationships
        all_columns = {}
        for table_name, info in table_info.items():
            all_columns[table_name] = set(info['columns'])
        
        print("\nLooking for common columns that might indicate relationships...")
        
        table_names = list(all_columns.keys())
        for i, table1 in enumerate(table_names):
            for table2 in table_names[i+1:]:
                common_cols = all_columns[table1] & all_columns[table2]
                if common_cols:
                    print(f"\n✓ {table1} ↔ {table2}")
                    print(f"  Common columns: {', '.join(common_cols)}")
        
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(json.dumps(table_info, indent=2, default=str))
    else:
        print(f"Single dataset")
        print(f"Rows: {len(dataset)}")
        print(f"Columns: {dataset.column_names}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

