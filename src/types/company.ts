/**
 * @fileoverview Company Type Definitions
 * 
 * TypeScript type definitions for company-related data structures
 * used throughout the application, especially in onboarding and API routes.
 */

/**
 * Company data structure returned from API
 * 
 * @interface Company
 * @property {string} id - Unique identifier for the company
 * @property {string} name - Company name
 * @property {string} createdAt - ISO date string when company was created
 * @property {object} _count - Count of related records
 * @property {number} _count.users - Number of users associated with this company
 */
export interface Company {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    users: number;
  };
}

/**
 * Data structure for creating a new company
 * 
 * @interface CreateCompanyRequest
 * @property {string} name - Company name (required, 1-255 characters)
 */
export interface CreateCompanyRequest {
  name: string;
}

/**
 * Search parameters for company lookup
 * 
 * @interface CompanySearchParams
 * @property {string} q - Search query string
 * @property {number} [limit] - Maximum number of results to return (default: 10)
 */
export interface CompanySearchParams {
  q: string;
  limit?: number;
}

/**
 * Company selector component props
 * 
 * @interface CompanySelectorProps
 * @property {function} [onCompanySelected] - Callback when a company is selected
 * @property {string} [className] - Additional CSS classes
 */
export interface CompanySelectorProps {
  onCompanySelected?: (company: Company) => void;
  className?: string;
} 