import cv2
import numpy as np
import os
import sys

def get_base_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

# Load images and their filenames from a folder
def load_images_from_folder(folder):
    images = []
    agent_names = []
    
    # Convert relative path to absolute path if needed
    if not os.path.isabs(folder):
        folder = os.path.join(get_base_path(), folder)
    
    for filename in os.listdir(folder):
        img = cv2.imread(os.path.join(folder, filename))
        if img is not None:
            images.append(img)
            agent_names.append(os.path.splitext(filename)[0])  # Use the filename (without extension) as the agent name
    return images, agent_names

# The rest of the functions remain exactly the same as they don't deal with paths
def resize_image(image, size=(50, 50)):
    return cv2.resize(image, size)

def equalize_histogram(image):
    if len(image.shape) == 2:  # Grayscale image
        return cv2.equalizeHist(image)
    elif len(image.shape) == 3:  # Color image
        ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
        ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
        return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

def extract_sift_features(image):
    sift = cv2.SIFT_create()
    keypoints, descriptors = sift.detectAndCompute(image, None)
    return keypoints, descriptors

def extract_orb_features(image):
    orb = cv2.ORB_create()
    keypoints, descriptors = orb.detectAndCompute(image, None)
    return keypoints, descriptors

def match_sift_features(descriptors1, descriptors2):
    index_params = dict(algorithm=1, trees=5)  # Algorithm 1 for KDTree
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(descriptors1, descriptors2, k=2)
    # Apply ratio test
    good_matches = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:
            good_matches.append(m)
    return good_matches

def match_orb_features(descriptors1, descriptors2):
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(descriptors1, descriptors2)
    matches = sorted(matches, key=lambda x: x.distance)
    return matches

def match_histogram(image1, image2):
    hist1 = cv2.calcHist([image1], [0], None, [256], [0, 256])
    hist2 = cv2.calcHist([image2], [0], None, [256], [0, 256])
    hist1 = cv2.normalize(hist1, hist1).flatten()
    hist2 = cv2.normalize(hist2, hist2).flatten()
    return cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

def find_matching_agent(input_image_path, reference_images, agent_names):
    # Convert to absolute path if relative
    if not os.path.isabs(input_image_path):
        input_image_path = os.path.join(get_base_path(), input_image_path)
        
    input_image = cv2.imread(input_image_path, cv2.IMREAD_GRAYSCALE)
    input_image = resize_image(input_image, (50, 50))
    input_image = equalize_histogram(input_image)
    
    sift_keypoints, sift_descriptors = extract_sift_features(input_image)
    orb_keypoints, orb_descriptors = extract_orb_features(input_image)
    
    max_matches = 0
    max_hist_score = 0
    matching_agent = None
    
    for i, ref_image in enumerate(reference_images):
        ref_image_gray = cv2.cvtColor(ref_image, cv2.COLOR_BGR2GRAY)
        ref_image_gray = resize_image(ref_image_gray, (50, 50))
        ref_image_gray = equalize_histogram(ref_image_gray)
        
        # Feature matching using SIFT
        _, ref_sift_descriptors = extract_sift_features(ref_image_gray)
        sift_matches = match_sift_features(sift_descriptors, ref_sift_descriptors)
        
        # Feature matching using ORB
        _, ref_orb_descriptors = extract_orb_features(ref_image_gray)
        orb_matches = match_orb_features(orb_descriptors, ref_orb_descriptors)
        
        # Histogram matching
        hist_score = match_histogram(input_image, ref_image_gray)
        
        # Weighted voting system
        total_matches = len(sift_matches) + len(orb_matches) + hist_score
        
        if total_matches > max_matches:
            max_matches = total_matches
            max_hist_score = hist_score
            matching_agent = agent_names[i]
    
    return matching_agent