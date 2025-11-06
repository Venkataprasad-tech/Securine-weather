from flask import Flask, request, jsonify, render_template
from sqlalchemy import create_engine, text
import math

# --- Flask App Initialization ---
app = Flask(__name__)

# --- Database Configuration ---
DB_USER = 'postgres'
DB_PASSWORD = 'post@05'
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = 'Securine'
TABLE_NAME = 'weather_records'

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD.replace('@', '%40')}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('records.html')

@app.route('/api/records', methods=['GET'])
def get_records():
    """REST API endpoint for retrieving paginated records."""
    try:
        # Get pagination parameters from the URL query string
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        offset = (page - 1) * per_page

        # Columns to select
        columns = 'datetime_utc, " _conds", " _tempm", " _hum", " _pressurem"'

        # 1. Get the total count of records
        count_query = f"SELECT COUNT(*) FROM {TABLE_NAME}"
        with engine.connect() as connection:
            total_records = connection.execute(text(count_query)).scalar_one()

        # 2. Get the paginated data from PostgreSQL
        data_query = f"""
            SELECT {columns} FROM {TABLE_NAME}
            ORDER BY datetime_utc DESC
            LIMIT :limit OFFSET :offset
        """

        with engine.connect() as connection:
            result = connection.execute(text(data_query),
                                        {"limit": per_page, "offset": offset})

            # Convert results to a list of dictionaries for JSON output
            records = [dict(row._mapping) for row in result]

        # Calculate total pages
        total_pages = math.ceil(total_records / per_page)

        # Return the data as JSON for end point connectivity
        return jsonify({
            'records': records,
            'total_records': total_records,
            'total_pages': total_pages,
            'current_page': page
        })

    except Exception as e:
        app.logger.error(f"API Error: {e}")
        return jsonify({'error': 'An internal error occurred'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
